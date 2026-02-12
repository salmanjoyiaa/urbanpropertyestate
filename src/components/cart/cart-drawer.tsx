"use client";

import { useEffect } from "react";
import { X, Trash2, ShoppingCart, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-context";

const FALLBACK_WHATSAPP = "+923177779990";

function formatWhatsAppUrl(phone: string, message: string) {
    const clean = phone.replace(/[^0-9+]/g, "").replace(/^\+/, "");
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export default function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, clearCart, toggleCart } = useCart();

    // Listen for toggle-cart events from voice agent
    useEffect(() => {
        const handler = () => toggleCart();
        window.addEventListener("toggle-cart", handler);
        return () => window.removeEventListener("toggle-cart", handler);
    }, [toggleCart]);

    const handleSendAll = () => {
        const lines = items.map((item, i) => {
            const typeLabel = item.type === "property" ? "🏠 Property" : "📦 Item";
            return `${i + 1}. ${typeLabel}: ${item.title} — ${item.currency} ${item.price.toLocaleString()}${item.city ? ` (${item.city})` : ""}`;
        });
        const message = `Hi! I'm interested in these items from UrbanEstate:\n\n${lines.join("\n")}\n\nPlease share more details. Thank you!`;
        const url = formatWhatsAppUrl(FALLBACK_WHATSAPP, message);
        window.open(url, "_blank");
    };

    const handleSendSingle = (item: typeof items[0]) => {
        const typeLabel = item.type === "property" ? "property" : "item";
        const message = `Hi! I'm interested in this ${typeLabel} from UrbanEstate:\n\n${item.title} — ${item.currency} ${item.price.toLocaleString()}${item.city ? ` in ${item.city}` : ""}\n\nPlease share more details. Thank you!`;
        const phone = item.agentPhone || FALLBACK_WHATSAPP;
        const url = formatWhatsAppUrl(phone, message);
        window.open(url, "_blank");
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
                    onClick={closeCart}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-background border-l shadow-2xl z-[70] transition-transform duration-300 ease-out flex flex-col ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <h2 className="font-display font-semibold text-lg">Your Cart</h2>
                        {items.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {items.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeCart}
                        className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-5">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <ShoppingCart className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <h3 className="font-display font-semibold mb-1">Cart is empty</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Ask our AI voice agent to find properties or marketplace items, then add them to your cart!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className="group flex gap-3 p-3 rounded-xl border bg-card hover:shadow-md transition-all"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">
                                                {item.type === "property" ? "🏠" : "📦"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                                                    item.type === "property"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}>
                                                    {item.type}
                                                </span>
                                                <h4 className="font-medium text-sm truncate mt-0.5">{item.title}</h4>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <p className="text-sm font-semibold text-primary">
                                                {item.currency} {item.price.toLocaleString()}
                                                {item.type === "property" && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                                            </p>
                                            <button
                                                onClick={() => handleSendSingle(item)}
                                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-[#25d366]/10 text-[#25d366] hover:bg-[#25d366]/20 transition-colors"
                                            >
                                                <MessageCircle className="h-3 w-3" />
                                                WhatsApp
                                            </button>
                                        </div>
                                        {item.city && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5">📍 {item.city}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {items.length > 0 && (
                    <div className="border-t px-5 py-4 space-y-3 bg-background">
                        <Button
                            onClick={handleSendAll}
                            className="w-full bg-[#25d366] hover:bg-[#20bd5a] text-white font-semibold h-11 rounded-xl shadow-lg shadow-[#25d366]/20"
                        >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Send All via WhatsApp
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </Button>
                        <Button
                            onClick={clearCart}
                            variant="outline"
                            className="w-full h-9 text-sm rounded-xl"
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Clear Cart
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
