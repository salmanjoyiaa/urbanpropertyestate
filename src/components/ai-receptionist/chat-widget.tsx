"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, BedDouble, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    listings?: Listing[];
    timestamp: Date;
}

interface Listing {
    id: string;
    title: string;
    city: string;
    area: string;
    rent: number;
    currency: string;
    beds: number;
    baths: number;
    type: string;
    property_photos: { url: string; is_cover: boolean }[];
    agent: { name: string; whatsapp_number: string };
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! 👋 I'm your UrbanEstate assistant. I can help you find the perfect rental property. What are you looking for?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const history = messages
                .filter((m) => m.id !== "welcome")
                .map((m) => ({ role: m.role, content: m.content }));

            const res = await fetch("/api/ai/receptionist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg.content,
                    history,
                }),
            });

            const data = await res.json();

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message || "Sorry, I couldn't process that. Try again?",
                listings: data.listings,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
                    timestamp: new Date(),
                },
            ]);
        }

        setLoading(false);
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
                    aria-label="Open AI Assistant"
                >
                    <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    {/* Pulse indicator */}
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[540px] max-h-[calc(100vh-6rem)] bg-background rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <MessageCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">AI Receptionist</h3>
                                <p className="text-xs opacity-80">Online · Responds instantly</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id}>
                                <div
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-br-md"
                                                : "bg-muted rounded-bl-md"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>

                                {/* Inline listing cards */}
                                {msg.listings && msg.listings.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {msg.listings.map((listing) => {
                                            const cover = listing.property_photos?.find((p) => p.is_cover) || listing.property_photos?.[0];
                                            return (
                                                <Link
                                                    key={listing.id}
                                                    href={`/properties/${listing.id}`}
                                                    className="block border rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
                                                >
                                                    <div className="flex">
                                                        {cover && (
                                                            <div className="w-20 h-20 shrink-0">
                                                                <img
                                                                    src={cover.url}
                                                                    alt={listing.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="p-2.5 flex-1 min-w-0">
                                                            <h4 className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                                                                {listing.title}
                                                            </h4>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                                <MapPin className="h-3 w-3 shrink-0" />
                                                                <span className="line-clamp-1">{listing.area}, {listing.city}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-1.5">
                                                                <span className="text-xs font-bold text-primary">
                                                                    {formatCurrency(listing.rent, listing.currency)}/mo
                                                                </span>
                                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <BedDouble className="h-3 w-3" />
                                                                    {listing.beds}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t p-3 shrink-0">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                placeholder="Ask about properties..."
                                className="flex-1 h-10 rounded-full border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={loading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                            Powered by AI · Responses may vary
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
