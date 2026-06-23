"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/hooks/useAppContext";
import axios from "axios";
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner"; // Assuming sonner is used, or fallback to alert

interface BankTransferFormProps {
    amount: number;
    cartId?: string;
    onSuccess: () => void;
    guestDetails?: {
        name: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        state: string;
        items: any[];
    };
}

export function BankTransferForm({ amount, cartId, onSuccess, guestDetails }: BankTransferFormProps) {
    const { user, openDialog } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [payeeName, setPayeeName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const BANK_DETAILS = {
        bankName: process.env.NEXT_PUBLIC_BANK_NAME,
        accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER,
        accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME,
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payeeName) {
            openDialog("Please enter the account name used for the transfer.", "Missing Info");
            return;
        }

        setLoading(true);
        try {
            let receiptUrl = "";

            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", "image");
                formData.append("userId", user?.id || "guest");
                formData.append("title", `Receipt for Cart ${cartId || "New"}`);
                formData.append("for", "payment_receipt");

                const uploadRes = await axios.post("/api/file/image", formData);
                if (uploadRes.status === 200) {
                    receiptUrl = uploadRes.data.url;
                }
            }

            if (cartId) {
                await axios.put(`/api/dbhandler?model=cart&id=${cartId}`, {
                    status: "unconfirmed",
                    payment: {
                        method: "bank_transfer",
                        amount,
                        receiptUrl,
                        payeeName,
                    },
                });

                try {
                    await axios.post("/api/send-notification", {
                        orderDetails: {
                            tx_ref: `bank_transfer_${cartId}`,
                            amount,
                            payeeName,
                            guestDetails: guestDetails || null
                        },
                    });
                } catch (emailError) {
                    console.warn("Failed to send email notifications:", emailError);
                }
            }

            setIsOpen(false);
            onSuccess();
            openDialog("Transfer submitted! Your order is pending confirmation.", "Submission Successful");

        } catch (error) {
            console.error("Transfer submission failed:", error);
            openDialog("Failed to submit transfer details. Please try again.", "Submission Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-2 border-green-500 text-green-500">
                    Bank Transfer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bank Transfer</DialogTitle>
                    <DialogDescription>
                        Please transfer <b>₦{amount.toLocaleString()}</b> to the account below, then provide your transfer details. The payment will be confirmed manually within few seconds.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Name:</span>
                        <span className="font-medium">{BANK_DETAILS.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="font-mono font-bold select-all">{BANK_DETAILS.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="font-medium">{BANK_DETAILS.accountName}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="accountName">Sender Account Name</Label>
                        <Input
                            id="accountName"
                            placeholder="e.g. John Doe"
                            value={payeeName}
                            onChange={(e) => setPayeeName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="receipt">Upload Receipt (Optional)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="receipt"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Label
                                htmlFor="receipt"
                                className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm hover:bg-muted w-full"
                            >
                                <Upload className="h-4 w-4" />
                                {file ? file.name : "Select Image"}
                            </Label>
                        </div>
                        {preview && (
                            <div className="relative h-32 w-full rounded-md overflow-hidden border">
                                <img src={preview} alt="Receipt preview" className="h-full w-full object-cover" />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Transfer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
