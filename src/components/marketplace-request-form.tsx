"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createMarketplaceRequest } from "@/actions/marketplace-requests";

interface MarketplaceRequestFormProps {
    itemId: string;
}

export default function MarketplaceRequestForm({ itemId }: MarketplaceRequestFormProps) {
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
            customerEmail: email || undefined,
            customerNote: note || undefined,
            honeypot: honeypot || undefined,
        });

        setResult(response);
        setLoading(false);
    }

    return (
        <div className="mt-2 space-y-2">
            <Button
                type="button"
                className="w-full"
                variant={open ? "secondary" : "default"}
                onClick={() => setOpen((prev) => !prev)}
            >
                {open ? "Hide Request Form" : "Request This Item"}
            </Button>

            {open && (
                <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
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
                        <Label htmlFor={`item-email-${itemId}`}>Email (optional)</Label>
                        <Input
                            id={`item-email-${itemId}`}
                            type="email"
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

                    {result?.error && <p className="text-xs text-red-500">{result.error}</p>}
                    {result?.success && (
                        <p className="text-xs text-emerald-600">
                            {result.message || "You will receive a confirmation email once your request is approved."}
                        </p>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
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
                </form>
            )}
        </div>
    );
}
