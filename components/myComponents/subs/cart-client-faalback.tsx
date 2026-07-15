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
import { addOrUpdateLocalReceipt, LocalReceipt } from "@/lib/localReceipts";
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
  Kwara: 2500, Kogi: 4000, Niger: 4000, Oyo: 4000, Osun: 4000,
  Ogun: 4000, Ondo: 4000, Ekiti: 4000, Benue: 4000, Nasarawa: 4000,
  Lagos: 4000, FCT: 4000, Edo: 4000,
  Anambra: 4000, Enugu: 4000, Imo: 4000, Abia: 4000, Ebonyi: 4000,
  Delta: 4000, Rivers: 4000, Akwa_Ibom: 4000, Cross_River: 4000, Bayelsa: 4000,
  Kaduna: 4000, Kano: 4000, Katsina: 4000, Jigawa: 4000, Zamfara: 4000,
  Sokoto: 4000, Kebbi: 4000, Bauchi: 4000, Gombe: 4000, Adamawa: 4000,
  Taraba: 4000, Borno: 4000, Yobe: 4000,
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
}

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
    const calculateDeliveryFee = (address?: Address | null): number => {
        const normalizedState = normalizeState(address?.state);
        if (!normalizedState) return 0;
        return DELIVERY_FEES_BY_STATE[normalizedState] ?? 4000;
    };

    const selectedAddress: Address | undefined = user?.addresses?.find(
        (a: Address) => a.id === selectedAddressId
    );

    const deliveryFee = items.length > 0 ? calculateDeliveryFee(selectedAddress) : 0;
    const totalAmount = Number(subtotal || 0) + Number(deliveryFee || 0);

    const saveLocalReceipt = (receipt: LocalReceipt) => {
        addOrUpdateLocalReceipt(receipt);
    };

    /* CHECKOUT */
    const prepareCheckout = async () => {
        if (!user?.id || !selectedAddressId || items.length === 0) return;

        try {
            const payload = {
                userId: user.id,
                items: items.map((i) => ({
                    productId: i.id,
                    quantity: i.quantity,
                })),
                deliveryFee,
                total: totalAmount,
                deliveryAddressId: selectedAddressId,
                ...(checkoutData?.cartId ? { cartId: checkoutData.cartId } : {}),
            };

            const res = await axios.post("/api/payment", payload);
            setCheckoutData(res.data);

            saveLocalReceipt({
                id: res.data.cartId,
                cartId: res.data.cartId,
                tx_ref: res.data.tx_ref,
                createdAt: new Date().toISOString(),
                status: "pending",
                total: totalAmount,
                deliveryFee,
                items: items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                customerName: user.name || "Customer",
                contact: user.contact || "",
                deliveryMethod: "delivery",
                deliveryAddress: `${selectedAddress?.address || ""}${selectedAddress?.city ? ", " + selectedAddress.city : ""}${selectedAddress?.state ? ", " + selectedAddress.state : ""}`.trim(),
                receiptUrl: "",
                linked: user.id !== "nil",
            });

            return res.data; // Return for reuse
        } catch (err) {
            console.error("Checkout initiation failed:", err);
            // alert("Checkout failed, please try again.");
            return null;
        }
    };

    // Wrapper for manual transfer that ensures cart exists first
    const handleBankTransferClick = async () => {
        // Logic: we need a cart ID to link the transfer to. 
        // Reuse prepareCheckout to generate the cart in DB.
        // If checkoutData already exists, use it.

        let cartId = checkoutData?.cartId;

        if (!cartId) {
            const data = await prepareCheckout();
            if (data && data.cartId) {
                cartId = data.cartId;
            }
        }

        return cartId; // Return to BankTransferForm if we could render it conditionally or pass it
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
        <div className="flex flex-col h-full">
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

            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto px-6">
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
            </div>

            {/* SUMMARY */}
            {items.length > 0 && (
                <div className="border-t px-6 py-4 space-y-3 w-full flex flex-col bg-background">

                    {/* DELIVERY ADDRESS OR EDIT USER */}
                    {user?.id !== 'nil' ? (
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Delivery Address</label>
                            {user.addresses && user.addresses.length > 0 ? (
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
                        <div className="w-full flex flex-col justify-center items-center space-y-4">
                            <p className="font-medium text-red-500 text-center">
                                Please log in to proceed with checkout.
                            </p>
                            <div className="flex flex-row gap-5">
                                <Login />
                                <Signup />
                            </div>
                        </div>
                    )}

                    {/* SUBTOTAL & DELIVERY FEE */}
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₦{Number(subtotal || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span>Delivery Fee</span>
                        <span>₦{Number(deliveryFee || 0).toFixed(2)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₦{totalAmount.toFixed(2)}</span>
                    </div>

                    {/* CHECKOUT BUTTONS */}
                    {user.id !== 'nil' ? (
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
                                        user?.id === 'nil' || !selectedAddressId || (user?.addresses?.length === 0)
                                    }
                                    onClick={prepareCheckout}
                                    className="w-full"
                                >
                                    Proceed to Checkout
                                </Button>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
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

                                    {/* Manual Transfer - Need to pass cartID */}
                                    <BankTransferForm
                                        amount={totalAmount}
                                        cartId={checkoutData.cartId}
                                        onSuccess={() => {
                                            clearCart();
                                            clearCheckoutData();
                                            setIsOpen(false);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}

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