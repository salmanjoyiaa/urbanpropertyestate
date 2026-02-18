"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogBody, DialogHeader } from "@/components/ui/dialog";
import { createMarketplaceRequest } from "@/actions/marketplace-requests";

interface MarketplaceRequestFormProps {
    itemId: string;
    itemTitle?: string;
}

export default function MarketplaceRequestForm({ itemId, itemTitle }: MarketplaceRequestFormProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [note, setNote] = useState("");
    const [honeypot, setHoneypot] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const response = await createMarketplaceRequest({
            itemId,
            customerName: name,
            customerPhone: phone,
            customerEmail: email,
            customerNote: note || undefined,
            honeypot: honeypot || undefined,
        });

        setResult(response);
        setLoading(false);
    }

    function handleClose() {
        if (!loading) {
            setOpen(false);
            if (result?.success) {
                setResult(null);
                setName("");
                setPhone("");
                setEmail("");
                setNote("");
            }
        }
    }

    return (
        <>
            <Button
                type="button"
                className="w-full"
                onClick={() => setOpen(true)}
            >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Request This Item
            </Button>

            <Dialog open={open} onOpenChange={handleClose}>
                {result?.success ? (
                    <>
                        <DialogHeader onClose={handleClose}>
                            <span />
                        </DialogHeader>
                        <DialogBody className="text-center space-y-4 pt-2">
                            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
                            <h3 className="font-display text-xl font-semibold">Request Submitted!</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                {result.message || "You will receive a confirmation email once your request is approved."}
                            </p>
                            <Button onClick={handleClose} variant="secondary" className="mt-2">
                                Close
                            </Button>
                        </DialogBody>
                    </>
                ) : (
                    <>
                        <DialogHeader onClose={handleClose}>
                            <div>
                                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                    Request Item
                                </h3>
                                {itemTitle && (
                                    <p className="text-sm text-muted-foreground mt-1">{itemTitle}</p>
                                )}
                            </div>
                        </DialogHeader>
                        <DialogBody>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor={`item-name-${itemId}`}>Full Name *</Label>
                                    <Input
                                        id={`item-name-${itemId}`}
                                        required
                                        minLength={2}
                                        maxLength={100}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your full name"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor={`item-phone-${itemId}`}>Phone Number *</Label>
                                    <Input
                                        id={`item-phone-${itemId}`}
                                        type="tel"
                                        required
                                        minLength={7}
                                        maxLength={20}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+971 50 123 4567"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor={`item-email-${itemId}`}>Email *</Label>
                                    <Input
                                        id={`item-email-${itemId}`}
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor={`item-note-${itemId}`}>Message (optional)</Label>
                                    <Textarea
                                        id={`item-note-${itemId}`}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={3}
                                        placeholder="Any extra details"
                                    />
                                </div>

                                <div className="absolute -left-[9999px]" aria-hidden="true">
                                    <input
                                        type="text"
                                        name="website"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        value={honeypot}
                                        onChange={(e) => setHoneypot(e.target.value)}
                                    />
                                </div>

                                {result?.error && (
                                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                                        <p className="text-sm text-red-600">{result.error}</p>
                                    </div>
                                )}

                                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending Request...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Submit Request
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-muted-foreground text-center">
                                    You will receive a confirmation email after admin review
                                </p>
                            </form>
                        </DialogBody>
                    </>
                )}
            </Dialog>
        </>
    );
}
