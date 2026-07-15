"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Loader2, RefreshCcw, ShoppingCart, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import FlutterWaveButtonHook from "../../payment/flutterwavehook";
import { useAppContext } from "@/hooks/useAppContext";
import { DELIVERY_FEES_BY_STATE } from "./cart-client"; // Assuming export
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import EditUser from "./useredit";
import { BankTransferForm } from "@/components/payment/BankTransferForm";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner"; // Assuming sonner

interface CartDetailsProps {
    cartId: string;
    onPaymentSuccess?: () => void;
}

interface CartItem {
    id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price: number;
        images: string[];
    };
}

interface CartData {
    id: string;
    name?: string;
    total: number;
    deliveryFee?: number;
    status: string;
    createdAt: string;
    products: CartItem[];
    payment?: {
        method: string;
        amount: number;
        tx_ref?: string;
    } | null;
}

const normalizeState = (state?: string | null): string | null => {
    if (!state) return null;
    return state.replace(/state/i, "").replace(/[-\s]/g, "_").trim();
};

interface Address {
    id: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
}

export function CartDetails({ cartId, onPaymentSuccess }: CartDetailsProps) {
    const [cart, setCart] = useState<CartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, openDialog } = useAppContext();
    const { clearCart, addItem } = useCart();

    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    
    // Name editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState("");

    useEffect(() => {
        if (user?.addresses?.length && !selectedAddressId) {
            setSelectedAddressId(user.addresses[0].id);
        }
    }, [user?.addresses]);

    useEffect(() => {
        const fetchCartDetails = async () => {
            if (!cartId) return;
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`/api/dbhandler?model=cart&id=${cartId}`);
                setCart(res.data);
                setEditedName(res.data.name || "");
            } catch (err) {
                console.error("Failed to fetch cart details:", err);
                setError("Failed to load cart details.");
            } finally {
                setLoading(false);
            }
        };

        fetchCartDetails();
    }, [cartId]);

    const handleSaveName = async () => {
        if (!cart) return;
        try {
            await axios.put(`/api/dbhandler?model=cart&id=${cart.id}`, { name: editedName });
            setCart({ ...cart, name: editedName });
            setIsEditingName(false);
            toast.success("Cart name updated");
        } catch (err) {
            console.error("Failed to update name", err);
            toast.error("Failed to update cart name");
        }
    }

    // ... existing ...

    const calculateDeliveryFee = (address?: Address | null): number => {
        const normalizedState = normalizeState(address?.state);
        if (!normalizedState) return 0;
        return DELIVERY_FEES_BY_STATE[normalizedState] ?? 4000;
    };

    const selectedAddress = user?.addresses?.find(a => a.id === selectedAddressId);
    const subtotal = cart?.products?.reduce((acc, item) => acc + ((item.product?.price || 0) * item.quantity), 0) || 0;

    // Is paid OR Unconfirmed (awaiting approval)
    const isLocked = cart?.status === "paid" || cart?.status === "completed" || cart?.status === "unconfirmed" || !!cart?.payment;

    // ✅ FIX 4: Use stored delivery fee for locked carts (NO recalculation)
    const deliveryFee = isLocked
        ? (cart?.deliveryFee ?? 0)  // Use stored value from DB
        : (cart?.products?.length ?? 0) > 0 ? calculateDeliveryFee(selectedAddress) : 0;

    const totalAmount = isLocked
        ? (cart?.total || 0)
        : subtotal + deliveryFee;

    // --- RE-CARTING ACTIONS ---
    const handleMakeCurrent = () => {
        if (!cart) return;
        if (confirm("This will replace your current active cart with the items from this order. Continue?")) {
            clearCart();
            cart.products.forEach(item => {
                // Mapping DB item to Cart Store item structure
                // NOTE: Store item expects { category, id, images, name, price }
                addItem({
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    images: item.product.images,
                    category: "Generic" // We might need to fetch/store category if strictly required, or use default
                }, item.quantity);
            });
            // alert("Cart updated successfully!");
            openDialog("Cart updated successfully!", "Cart Updated");
            // Optional: Open cart drawer logic if accessible
        }
    };

    const handleAddToCurrent = () => {
        if (!cart) return;
        cart.products.forEach(item => {
            addItem({
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                images: item.product.images,
                category: "Generic"
            }, item.quantity);
        });
        // alert("Items added to your active cart!");
        openDialog("Items added to your active cart!", "Cart Updated");
    };

    if (loading) {
        return (
            <Card className="w-full h-full min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    if (error || !cart) {
        return (
            <Card className="w-full">
                <CardContent className="py-10 text-center text-muted-foreground">
                    {error || "Cart not found"}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full overflow-hidden flex flex-col border-none shadow-none lg:border lg:shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b mb-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             {isEditingName ? (
                                 <div className="flex items-center gap-2">
                                     <input 
                                         className="h-8 rounded border px-2 text-sm max-w-[150px]"
                                         value={editedName}
                                         onChange={(e) => setEditedName(e.target.value)}
                                         placeholder="Name this cart..."
                                     />
                                     <Button size="sm" onClick={handleSaveName}>Save</Button>
                                     <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>Cancel</Button>
                                 </div>
                             ) : (
                                 <CardTitle className="text-xl font-semibold flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                                     {cart?.name || (isLocked ? "Order Details" : "Review & Pay")}
                                     <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 font-normal ml-2">(Edit Name)</span>
                                 </CardTitle>
                             )}
                        </div>
                        <Badge variant={cart?.status === 'paid' ? "default" : cart?.status === 'unconfirmed' ? "outline" : "destructive"}>
                            {cart?.status}
                        </Badge>
                    </div>

                    {/* Re-Carting Controls */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleAddToCurrent}>
                            <Plus className="mr-2 h-3 w-3" /> Add to Cart
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleMakeCurrent}>
                            <RefreshCcw className="mr-2 h-3 w-3" /> Make Current
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-auto p-0 px-1">
                <div className="flex flex-col h-full">

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
                        <AnimatePresence>
                            {cart.products?.map((item) => {
                                const imageUrl = item.product?.images?.[0] || "/placeholder.jpg";
                                return (
                                    <motion.div
                                        key={item.id}
                                        className="flex rounded-lg border bg-card p-2 shadow-sm"
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={item.product?.name ?? "Product"}
                                            className="h-20 w-20 rounded object-cover bg-muted"
                                        />
                                        <div className="ml-4 flex flex-1 flex-col justify-between">
                                            <div className="flex justify-between items-start gap-2">
                                                <Link href={`/store/${item.product?.id}`} className="text-sm font-medium line-clamp-2 hover:underline">
                                                    {item.product?.name ?? "Unnamed product"}
                                                </Link>
                                            </div>

                                            <div className="mt-2 flex justify-between items-center">
                                                <div className="flex items-center text-sm text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                                    <span>Qty: {item.quantity}</span>
                                                </div>
                                                <span className="text-sm font-medium">
                                                    ₦{((item.product?.price || 0) * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Footer / Summary */}
                    <div className="bg-muted/10 p-6 space-y-3 border-t mt-auto">

                        {/* Address Selection (Only for pending) */}
                        {!isLocked && user?.id !== 'nil' && (
                            <div className="space-y-1 mb-4 p-3 bg-background border rounded-lg">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    Delivery Address
                                </label>
                                {user?.addresses && user?.addresses.length > 0 ? (
                                    <div className="space-y-2">
                                        <select
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={selectedAddressId ?? ""}
                                            onChange={(e) => setSelectedAddressId(e.target.value)}
                                        >
                                            {user.addresses.map((address: Address) => (
                                                <option key={address.id} value={address.id}>
                                                    {[address.address, address.city, address.state].filter(Boolean).join(", ")}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm text-destructive">No addresses found.</p>
                                        <EditUser />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>₦{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                                Delivery Fee
                                {!isLocked && <span className="text-xs text-muted-foreground">({selectedAddress?.state || "Standard"})</span>}
                            </span>
                            <span>₦{deliveryFee.toFixed(2)}</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>₦{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {/* Payment Actions */}
                        {!isLocked && user && (
                            <div className="pt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <FlutterWaveButtonHook
                                        tx_ref={`retry-${cart.id}-${Date.now()}`}
                                        amount={totalAmount}
                                        currency="NGN"
                                        email={user?.email || ""}
                                        phonenumber={user?.contact || ""}
                                        name={user?.name || "Customer"}
                                        disabled={!selectedAddressId}
                                        onSuccess={async (response) => {
                                            try {
                                                await axios.put(`/api/dbhandler?model=cart&id=${cart.id}`, {
                                                    status: "paid",
                                                    total: totalAmount,
                                                });
                                                setCart(prev => prev ? ({ ...prev, status: "paid", total: totalAmount }) : null);
                                                if (onPaymentSuccess) onPaymentSuccess();
                                            } catch (err) {
                                                console.error("Failed to update cart status", err);
                                            }
                                        }}
                                    />

                                    <BankTransferForm
                                        cartId={cart.id}
                                        amount={totalAmount}
                                        onSuccess={() => {
                                            // Refresh cart logic
                                            setCart(prev => prev ? ({ ...prev, status: "unconfirmed" }) : null);
                                            if (onPaymentSuccess) onPaymentSuccess();
                                        }}
                                    />
                                </div>

                                {!selectedAddressId && (
                                    <p className="text-xs text-destructive text-center">
                                        Select address to pay.
                                    </p>
                                )}
                            </div>
                        )}

                        {cart.status === 'unconfirmed' && (
                            <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
                                Payment is checking unconfirmed. Waiting for admin approval.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
