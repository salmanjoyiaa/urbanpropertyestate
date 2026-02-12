"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Sparkles, Loader2, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WhatsAppMessage, WhatsAppComposerResponse } from "@/lib/ai/types";

interface SmartWhatsAppComposerProps {
    whatsappNumber: string;
    agentName: string;
    propertyTitle: string;
    propertyId: string;
    propertyDetails?: Record<string, unknown>;
    className?: string;
}

const DEFAULT_MESSAGES: WhatsAppMessage[] = [
    { intent: "viewing", label: "Request Viewing", emoji: "📅", message: "" },
    { intent: "move_in", label: "Ask Move-in Date", emoji: "🏠", message: "" },
    { intent: "documents", label: "Required Documents", emoji: "📄", message: "" },
    { intent: "payment", label: "Payment Terms", emoji: "💰", message: "" },
    { intent: "general", label: "General Inquiry", emoji: "💬", message: "" },
];

export default function SmartWhatsAppComposer({
    whatsappNumber,
    agentName,
    propertyTitle,
    propertyId,
    propertyDetails,
    className,
}: SmartWhatsAppComposerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<WhatsAppMessage[]>(DEFAULT_MESSAGES);
    const [customMessage, setCustomMessage] = useState("");
    const [generated, setGenerated] = useState(false);

    const generateMessages = async () => {
        if (generated) return;
        setLoading(true);

        try {
            const res = await fetch("/api/ai/whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyTitle,
                    propertyDetails: {
                        ...propertyDetails,
                        propertyId,
                    },
                    agentName,
                }),
            });

            const data: WhatsAppComposerResponse = await res.json();
            if (res.ok && data.messages?.length > 0) {
                setMessages(data.messages);
                setGenerated(true);
            }
        } catch {
            // Keep default messages on failure
        } finally {
            setLoading(false);
        }
    };

    const sendToWhatsApp = (message: string) => {
        const propertyUrl = typeof window !== "undefined"
            ? `${window.location.origin}/properties/${propertyId}`
            : `/properties/${propertyId}`;
        const fullMessage = `${message}\n\nProperty: ${propertyTitle}\n${propertyUrl}`;
        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(fullMessage)}`;
        window.open(url, "_blank");
    };

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen && !generated) {
            generateMessages();
        }
    };

    return (
        <div className={`relative ${className || ""}`}>
            {/* Main Button */}
            <div className="flex">
                <Button
                    variant="whatsapp"
                    size="lg"
                    className="rounded-r-none flex-1"
                    onClick={() => sendToWhatsApp(`Hi ${agentName}, I'm interested in ${propertyTitle}.`)}
                >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Book on WhatsApp
                </Button>
                <Button
                    variant="whatsapp"
                    size="lg"
                    className="rounded-l-none border-l border-emerald-700 px-2"
                    onClick={handleOpen}
                >
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </Button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border bg-background shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b bg-muted/30">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            Smart Message Suggestions
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating smart messages...
                        </div>
                    ) : (
                        <div className="max-h-80 overflow-y-auto">
                            {messages.map((msg, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        sendToWhatsApp(msg.message);
                                        setIsOpen(false);
                                    }}
                                    className="flex items-start gap-3 w-full p-3 hover:bg-muted/50 text-left transition-colors border-b last:border-b-0"
                                >
                                    <span className="text-lg flex-shrink-0">{msg.emoji}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">{msg.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                            {msg.message || "Click to send"}
                                        </p>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-1" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Custom Message */}
                    <div className="p-3 border-t bg-muted/10">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Type a custom message..."
                                className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && customMessage.trim()) {
                                        sendToWhatsApp(customMessage);
                                        setCustomMessage("");
                                        setIsOpen(false);
                                    }
                                }}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => {
                                    if (customMessage.trim()) {
                                        sendToWhatsApp(customMessage);
                                        setCustomMessage("");
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
