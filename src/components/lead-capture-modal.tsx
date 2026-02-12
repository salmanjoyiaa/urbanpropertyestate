"use client";

import { useState } from "react";
import { X, User, Phone, Mail, DollarSign, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyTitle: string;
    propertyId: string;
    agentId: string;
    agentName: string;
    agentWhatsapp: string;
}

export default function LeadCaptureModal({
    isOpen,
    onClose,
    propertyTitle,
    propertyId,
    agentId,
    agentName,
    agentWhatsapp,
}: LeadCaptureModalProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [budget, setBudget] = useState("");
    const [moveInDate, setMoveInDate] = useState("");
    const [message, setMessage] = useState(`Hi, I'm interested in "${propertyTitle}". Is it still available?`);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Save lead to database
            await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    property_id: propertyId,
                    agent_id: agentId,
                    contact_name: name,
                    contact_phone: phone,
                    contact_email: email,
                    message: message,
                    source: "form",
                    metadata: { budget, move_in_date: moveInDate },
                }),
            });
        } catch {
            // Continue to WhatsApp even if save fails
        }

        // Build rich WhatsApp message
        const whatsappMsg = [
            `Hi ${agentName}!`,
            `I'm interested in: ${propertyTitle}`,
            name && `Name: ${name}`,
            phone && `Phone: ${phone}`,
            budget && `Budget: ${budget}`,
            moveInDate && `Move-in: ${moveInDate}`,
            message && `\n${message}`,
        ].filter(Boolean).join("\n");

        const whatsappUrl = `https://wa.me/${agentWhatsapp}?text=${encodeURIComponent(whatsappMsg)}`;
        window.open(whatsappUrl, "_blank");
        setSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border animate-fade-in">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-display text-lg font-bold">Contact Agent</h3>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{propertyTitle}</p>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+92..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Budget</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        placeholder="Monthly"
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Move-in Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={moveInDate}
                                        onChange={(e) => setMoveInDate(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={3}
                                    className="flex w-full rounded-md border border-input bg-background pl-10 px-3 py-2 text-sm resize-none"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full gap-2" disabled={submitting}>
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                </svg>
                            )}
                            {submitting ? "Sending..." : "Continue to WhatsApp"}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            Your info is saved so the agent can follow up
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
