"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useAppContext } from "@/hooks/useAppContext";
import FlutterWaveButtonHook from "../../payment/flutterwavehook";
import dynamic from 'next/dynamic'
import { Login } from "@/components/myComponents/subs"
import { Signup } from "@/components/myComponents/subs"
import EditUser from "./useredit";
import { BankTransferForm } from "@/components/payment/BankTransferForm";

/* DELIVERY FEES */
export const DELIVERY_FEES_BY_STATE: Record<string, number> = {
  Kwara: 500, Kogi: 5000, Niger: 5000, Oyo: 4000, Osun: 4000,
  Ogun: 4000, Ondo: 4000, Ekiti: 4000, Benue: 5000, Nasarawa: 3500,
  Lagos: 4000, FCT: 4000, Edo: 4000,
  Anambra: 6000, Enugu: 5000, Imo: 6000, Abia: 6000, Ebonyi: 6000,
  Delta: 6000, Rivers: 6000, Akwa_Ibom: 6000, Cross_River: 6000, Bayelsa: 6000,
  Kaduna: 5000, Kano: 5000, Katsina: 5000, Jigawa: 5000, Zamfara: 5000,
  Sokoto: 5500, Kebbi: 5500, Bauchi: 5500, Gombe: 5500, Adamawa: 6000,
  Taraba: 6000, Borno: 6500, Yobe: 6500,
};

/* TYPES */
export interface CartItem {
  category: string;
  id: string;
  images: any[];
  name: string;
  price: number;
  quantity: number;
}

interface CartProps {
  className?: string;
  cart?: any;
}

interface Address {
  id: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  phone?: string | null;
}

type DeliveryMethod = "delivery" | "pickup";

/* HELPERS */
const normalizeState = (state?: string | null): string | null => {
  if (!state) return null;
  return state.replace(/state/i, "").replace(/[-\s]/g, "_").trim();
};

/* COMPONENT */
export function CartClient({ className }: CartProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { items, removeItem, clearCart, subtotal, updateQuantity, itemCount, setCheckoutData, checkoutData, clearCheckoutData } = useCart();
  const { user } = useAppContext();

  // Guest details state
  const [guestName, setGuestName] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestState, setGuestState] = React.useState("Lagos");
  const [guestCity, setGuestCity] = React.useState("");
  const [guestAddress, setGuestAddress] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState<DeliveryMethod>("delivery");

  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(
    user?.addresses?.[0]?.id ?? null
  );

  React.useEffect(() => setIsMounted(true), []);

  React.useEffect(() => {
    if (!selectedAddressId && user?.addresses?.length) {
      setSelectedAddressId(user.addresses[0].id);
    }
  }, [user?.addresses, selectedAddressId]);

  /* DELIVERY FEE LOGIC */
  const [dbDeliveryFee, setDbDeliveryFee] = React.useState<number>(0);
  const [loadingFee, setLoadingFee] = React.useState(false);

  const selectedAddress: Address | undefined = user?.addresses?.find(
    (a: Address) => a.id === selectedAddressId
  );

  React.useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (deliveryMethod === "pickup") {
        setDbDeliveryFee(0);
        setLoadingFee(false);
        return;
      }

      if (!selectedAddress && user?.id !== 'nil') {
        setDbDeliveryFee(0);
        return;
      }

      setLoadingFee(true);
      try {
        const res = await axios.get('/api/dbhandler?model=deliveryFee');
        const fees: any[] = res.data;

        if (!Array.isArray(fees)) return;

        const country = user?.id !== 'nil' ? selectedAddress?.country : "Nigeria";
        const state = user?.id !== 'nil' ? selectedAddress?.state : guestState;
        const city = user?.id !== 'nil' ? selectedAddress?.city : guestCity;

        const normalizedState = normalizeState(state);

        const match = fees.find(f =>
          f.country === (country || 'Nigeria') &&
          f.state === normalizedState &&
          f.city === city
        ) || fees.find(f =>
          f.country === (country || 'Nigeria') &&
          f.state === normalizedState &&
          !f.city
        ) || fees.find(f =>
          f.country === (country || 'Nigeria') &&
          !f.state
        );

        setDbDeliveryFee(match ? match.price : 6500); // Default fallback
      } catch (err) {
        console.error("Failed to fetch delivery fee", err);
        setDbDeliveryFee(6500);
      } finally {
        setLoadingFee(false);
      }
    };

    fetchDeliveryFee();
  }, [selectedAddress, user?.id, guestState, guestCity, deliveryMethod]);

  const deliveryFee = items.length > 0 && deliveryMethod === "delivery" ? dbDeliveryFee : 0;
  const totalAmount = Number(subtotal || 0) + Number(deliveryFee || 0);

  /* CHECKOUT */
  const prepareCheckout = async () => {
    if (items.length === 0) return;

    if (user?.id === 'nil') {
      const requiresAddress = deliveryMethod === "delivery";
      if (!guestName || !guestPhone || (requiresAddress && (!guestAddress || !guestState))) {
        alert(requiresAddress ? "Please fill in your contact details and delivery address." : "Please fill in your contact details.");
        return null;
      }
    } else {
      if (deliveryMethod === "delivery" && !selectedAddressId) {
        alert("Please select a delivery address before checkout.");
        return null;
      }
      if (!user?.contact || user.contact === "xxxx-xxx-xxxx") {
        alert("Please update your contact information before checkout. Go to your account settings to add your phone number.");
        return null;
      }
    }

    try {
      const payload = {
        userId: user.id,
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
        })),
        deliveryFee,
        total: totalAmount,
        deliveryMethod,
        pickupLocation: deliveryMethod === "pickup" ? "Loyz Collection Pickup Point" : undefined,
        deliveryAddressId: user?.id !== 'nil' && deliveryMethod === "delivery" ? selectedAddressId : undefined,
        customerEmail: user?.id !== 'nil' ? user?.email : guestEmail || undefined,
        name: user?.id !== 'nil' ? undefined : guestName,
        contact: user?.id !== 'nil' ? undefined : `${guestPhone} | Email: ${guestEmail || 'none'} | ${deliveryMethod === 'pickup' ? 'Pickup selected' : `Address: ${guestAddress}, ${guestCity || 'N/A'}, ${guestState}`}`,
        ...(user?.id === 'nil' ? {
          guestDetails: {
            name: guestName,
            phone: guestPhone,
            email: guestEmail,
            address: guestAddress,
            city: guestCity,
            state: guestState,
          }
        } : {}),
        ...(checkoutData?.cartId ? { cartId: checkoutData.cartId } : {}),
      };

      const res = await axios.post("/api/payment", payload);
      setCheckoutData(res.data);
      return res.data; // Return for reuse
    } catch (err: any) {
      console.error("Checkout initiation failed:", err);
      const errorMessage = err?.response?.data?.error || "Checkout failed, please try again.";
      alert(errorMessage);
      return null;
    }
  };

  /* CART TRIGGER */
  const CartTrigger = (
    <Button aria-label="Open cart" className="relative h-9 w-9 rounded-full" size="icon" variant="outline">
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px] flex justify-center items-center">
          {itemCount}
        </Badge>
      )}
    </Button>
  );

  /* CART CONTENT */
  const CartContent = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="text-xl font-semibold">Your Cart</div>
          <div className="text-sm text-muted-foreground">
            {itemCount === 0 ? "Your cart is empty" : `You have ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/cart">
            <Button variant="outline" size="sm">
              All Carts
            </Button>
          </Link>
          {isDesktop && (
            <SheetClose asChild>
              <Button size="icon" variant="ghost">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        <AnimatePresence>
          {items.length === 0 ? (
            <motion.div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </motion.div>
          ) : (
            <div className="space-y-4 py-4">
              {items.map((item) => {
                const imageUrl =
                  Array.isArray(item.images) && item.images.length > 0
                    ? item.images[0]
                    : "/placeholder.jpg";

                return (
                  <motion.div key={item.id} layout className="flex rounded-lg border bg-card p-2">
                    <img src={imageUrl} alt={item.name ?? "Product"} className="h-20 w-20 rounded object-cover" />
                    <div className="ml-4 flex flex-1 flex-col justify-between">
                      <div className="flex justify-between">
                        <Link href={`/store/${item.id}`} className="text-sm font-medium">
                          {item.name ?? "Unnamed product"}
                        </Link>
                        <button onClick={() => removeItem(item.id)}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex items-center border rounded">
                          <button
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-medium">
                          ₦{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {items.length > 0 && (
          <div className="mt-4 border-t pt-4 space-y-3 w-full flex flex-col bg-background">

          {/* DELIVERY ADDRESS OR EDIT USER */}
          <div className="rounded-md border border-border/70 bg-secondary/10 p-3">
            <div className="mb-2 text-sm font-medium">Delivery Option</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={deliveryMethod === "delivery" ? "default" : "outline"}
                size="sm"
                onClick={() => setDeliveryMethod("delivery")}
              >
                Delivery
              </Button>
              <Button
                type="button"
                variant={deliveryMethod === "pickup" ? "default" : "outline"}
                size="sm"
                onClick={() => setDeliveryMethod("pickup")}
              >
                Pickup
              </Button>
            </div>
            {deliveryMethod === "pickup" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Pickup is free and the pickup location will be included in your confirmation email.
              </p>
            )}
          </div>

          {user?.id !== 'nil' ? (
            <div className="space-y-1">
              <label className="text-sm font-medium">{deliveryMethod === "pickup" ? "Pickup Details" : "Delivery Address"}</label>
              {deliveryMethod === "pickup" ? (
                <div className="rounded-md border border-dashed border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">
                  Pickup is selected. No delivery address is needed for checkout.
                </div>
              ) : user.addresses && user.addresses.length > 0 ? (
                <div>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={selectedAddressId ?? ""}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {user.addresses.map((address: Address) => (
                      <option key={address.id} value={address.id}>
                        {[address.address, address.city, address.state].filter(Boolean).join(", ")}
                      </option>
                    ))}
                  </select>
                  <div>
                    <div className="mb-2 font-semibold text-xs mt-1">
                      <EditUser />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-red-500">No addresses found.</p>
                  <EditUser />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 bg-secondary/10 p-3 rounded-lg border border-border">
              <h4 className="text-sm font-semibold">Delivery & Contact Details (Guest)</h4>
              
              {/* Optional Login/Signup buttons (commented out as per user request to comment out compulsory login/signup buttons) */}
              {/*
              <div className="flex flex-row gap-5 mb-2 justify-center">
                <Login />
                <Signup />
              </div>
              */}

              <input
                type="text"
                placeholder="Your Full Name"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email Address (optional)"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
              {deliveryMethod === "delivery" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={guestState}
                      onChange={(e) => setGuestState(e.target.value)}
                    >
                      {Object.keys(DELIVERY_FEES_BY_STATE).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="FCT">FCT</option>
                      <option value="Plateau">Plateau</option>
                    </select>
                    <input
                      type="text"
                      placeholder="City (optional)"
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={guestCity}
                      onChange={(e) => setGuestCity(e.target.value)}
                    />
                  </div>
                  <textarea
                    placeholder="Street Address"
                    className="w-full rounded-md border bg-background px-3 py-1.5 text-sm h-16 resize-none"
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                    required
                  />
                </>
              ) : (
                <div className="rounded-md border border-dashed border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">
                  Pickup selected. The pickup location will be shared in your confirmation email.
                </div>
              )}
            </div>
          )}

          {/* SUBTOTAL & DELIVERY FEE */}
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₦{Number(subtotal || 0).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>{deliveryMethod === "pickup" ? "Pickup Fee" : "Delivery Fee"}</span>
            <span>₦{Number(deliveryFee || 0).toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₦{totalAmount.toFixed(2)}</span>
          </div>

          {/* CHECKOUT BUTTONS */}
          <div className="space-y-3">
            {/* 
                 Logic: 
                 1. User clicks "Checkout" -> creates cart in DB -> shows Payment Options.
                 OR
                 2. We show payment options directly if 'checkoutData' exists.
               */}

            {!checkoutData ? (
              <Button
                disabled={
                  user?.id !== 'nil' && (!selectedAddressId || (user?.addresses?.length === 0))
                }
                onClick={prepareCheckout}
                className="w-full"
              >
                Proceed to Checkout
              </Button>
            ) : (
              <div className={cn("grid gap-2", user?.id !== 'nil' ? "grid-cols-2" : "grid-cols-1")}>
                {user?.id !== 'nil' && (
                  <FlutterWaveButtonHook
                    tx_ref={checkoutData.tx_ref}
                    amount={totalAmount}
                    currency="NGN"
                    email={user?.email ?? "noemail@loyzfoods.com"}
                    phonenumber={user?.contact ?? "0000000000"}
                    name={user?.name ?? "Customer"}
                    onSuccess={async () => {
                      await axios.post(`/api/payment?action=confirm`, { tx_ref: checkoutData.tx_ref });
                      clearCart();
                      clearCheckoutData();
                      setIsOpen(false);
                    }}
                  />
                )}

                {/* Manual Transfer - Need to pass cartID */}
                <BankTransferForm
                  amount={totalAmount}
                  cartId={checkoutData.cartId}
                  onSuccess={() => {
                    clearCart();
                    clearCheckoutData();
                    setIsOpen(false);
                  }}
                  guestDetails={user?.id === 'nil' ? {
                    name: guestName,
                    phone: guestPhone,
                    email: guestEmail,
                    address: guestAddress,
                    city: guestCity,
                    state: guestState,
                    items: items
                  } : undefined}
                />
              </div>
            )}
          </div>
        </div>
      )}
      </div>

    </div>
  );

  if (!isMounted) return null;

  return (
    <div className={cn("relative", className)}>
      {isDesktop ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>{CartTrigger}</SheetTrigger>
          <SheetContent className="p-0 w-[400px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Shopping Cart</SheetTitle>
            </SheetHeader>
            {CartContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>{CartTrigger}</DrawerTrigger>
          <DrawerContent className="h-[85vh]">
            {CartContent}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}