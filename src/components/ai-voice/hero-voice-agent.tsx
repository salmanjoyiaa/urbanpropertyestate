"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Send, X, MessageCircle, ShoppingCart, MapPin, BedDouble, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import VoiceOrb from "./voice-orb";
import VoiceSubtitles from "./voice-subtitles";
import { useVoiceAgent } from "./use-voice-agent";
import type { Listing, MarketplaceItem } from "./use-voice-agent";
import { useCart } from "@/components/cart/cart-context";
import { formatCurrency } from "@/lib/utils";

export default function HeroVoiceAgent() {
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState("");
    const textInputRef = useRef<HTMLInputElement>(null);

    const {
        state,
        transcript,
        response,
        speakingWordIndex,
        audioPlaying,
        cart: voiceCart,
        listings,
        marketplaceItems,
        analyserNode,
        micAnalyser,
        startListening,
        stopListening,
        sendTextQuery,
        cancel,
        addToCart: voiceAddToCart,
    } = useVoiceAgent();

    const { addItem, itemCount, items: cartItems } = useCart();

    // Sync voice agent cart items to global cart context
    useEffect(() => {
        if (voiceCart.length > 0) {
            const latest = voiceCart[voiceCart.length - 1];
            addItem(latest);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voiceCart.length]);

    useEffect(() => {
        if (showTextInput && textInputRef.current) textInputRef.current.focus();
    }, [showTextInput]);

    // Walkie-talkie: hold to talk, release to send
    const handleMicDown = () => {
        if (state === "speaking") { cancel(); return; }
        if (state === "idle") startListening();
    };

    const handleMicUp = () => {
        if (state === "listening") stopListening();
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim() || state === "thinking" || state === "speaking") return;
        sendTextQuery(textInput.trim());
        setTextInput("");
        setShowTextInput(false);
    };

    return (
        <div className="relative flex flex-col items-center w-full max-w-md mx-auto">
            {/* Sound Wave Visualizer */}
            <div className="relative">
                <VoiceOrb
                    state={state}
                    analyserNode={analyserNode}
                    micAnalyser={micAnalyser}
                    size={300}
                />

                {/* Cart badge */}
                {itemCount > 0 && (
                    <div className="absolute top-0 right-4 z-20 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/30 animate-scale-in">
                        {itemCount}
                    </div>
                )}
            </div>

            {/* Subtitles */}
            <VoiceSubtitles
                state={state}
                transcript={transcript}
                response={response}
                speakingWordIndex={speakingWordIndex}
                audioPlaying={audioPlaying}
            />

            {/* Real-time Property Cards */}
            {listings.length > 0 && (
                <div className="w-full mt-3 animate-fade-in">
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-1">
                        {listings.map((listing: Listing) => {
                            const cover = listing.property_photos?.find((p) => p.is_cover) || listing.property_photos?.[0];
                            const inCart = cartItems.some((c) => c.id === listing.id);
                            return (
                                <div key={listing.id} className="snap-start shrink-0 w-[200px] rounded-xl overflow-hidden bg-white/[0.08] border border-white/10 backdrop-blur-sm hover:bg-white/[0.12] transition-all group">
                                    <Link href={`/properties/${listing.id}`} className="block">
                                        {cover && (
                                            <div className="w-full h-24 relative overflow-hidden">
                                                <img src={cover.url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            </div>
                                        )}
                                        <div className="p-2.5">
                                            <h4 className="text-xs font-semibold text-white line-clamp-1">{listing.title}</h4>
                                            <div className="flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3 text-white/50 shrink-0" />
                                                <span className="text-[10px] text-white/50 line-clamp-1">{listing.area}, {listing.city}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className="text-xs font-bold text-emerald-400">{formatCurrency(listing.rent, listing.currency)}/mo</span>
                                                <span className="flex items-center gap-0.5 text-[10px] text-white/40">
                                                    <BedDouble className="h-3 w-3" />{listing.beds}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="px-2.5 pb-2">
                                        <button
                                            onClick={() => {
                                                addItem({
                                                    type: "property",
                                                    id: listing.id,
                                                    title: listing.title,
                                                    price: listing.rent,
                                                    currency: listing.currency,
                                                    image: cover?.url,
                                                    agentPhone: listing.agent?.whatsapp_number,
                                                    agentName: listing.agent?.name,
                                                    city: listing.city,
                                                });
                                            }}
                                            disabled={inCart}
                                            className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                                                inCart
                                                    ? "bg-emerald-500/20 text-emerald-300 cursor-default"
                                                    : "bg-white/10 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300"
                                            }`}
                                        >
                                            {inCart ? "In Cart" : <><Plus className="h-3 w-3" /> Add to Cart</>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Real-time Marketplace Cards */}
            {marketplaceItems.length > 0 && (
                <div className="w-full mt-3 animate-fade-in">
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-1">
                        {marketplaceItems.map((item: MarketplaceItem) => {
                            const cover = item.household_item_photos?.find((p) => p.is_cover) || item.household_item_photos?.[0];
                            const inCart = cartItems.some((c) => c.id === item.id);
                            return (
                                <div key={item.id} className="snap-start shrink-0 w-[200px] rounded-xl overflow-hidden bg-white/[0.08] border border-white/10 backdrop-blur-sm hover:bg-white/[0.12] transition-all group">
                                    {cover && (
                                        <div className="w-full h-24 relative overflow-hidden">
                                            <img src={cover.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        </div>
                                    )}
                                    <div className="p-2.5">
                                        <h4 className="text-xs font-semibold text-white line-clamp-1">{item.title}</h4>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Tag className="h-3 w-3 text-white/50 shrink-0" />
                                            <span className="text-[10px] text-white/50 capitalize">{item.category} · {item.condition?.replace("_", " ")}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-xs font-bold text-emerald-400">{formatCurrency(item.price, item.currency)}</span>
                                            <span className="flex items-center gap-0.5 text-[10px] text-white/40">
                                                <MapPin className="h-3 w-3" />{item.city}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-2.5 pb-2">
                                        <button
                                            onClick={() => {
                                                addItem({
                                                    type: "marketplace",
                                                    id: item.id,
                                                    title: item.title,
                                                    price: item.price,
                                                    currency: item.currency,
                                                    image: cover?.url,
                                                    agentPhone: item.seller?.whatsapp_number,
                                                    agentName: item.seller?.name,
                                                    city: item.city,
                                                });
                                            }}
                                            disabled={inCart}
                                            className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                                                inCart
                                                    ? "bg-emerald-500/20 text-emerald-300 cursor-default"
                                                    : "bg-white/10 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300"
                                            }`}
                                        >
                                            {inCart ? "In Cart" : <><Plus className="h-3 w-3" /> Add to Cart</>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="relative flex items-center gap-3 mt-4">
                {/* Mic button — walkie-talkie: hold to talk, release to send */}
                <button
                    onPointerDown={handleMicDown}
                    onPointerUp={handleMicUp}
                    onPointerLeave={handleMicUp}
                    onContextMenu={(e) => e.preventDefault()}
                    disabled={state === "thinking"}
                    aria-label={state === "listening" ? "Release to send" : "Hold to talk"}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg select-none touch-none ${
                        state === "listening"
                            ? "bg-red-500 hover:bg-red-600 text-white scale-110 shadow-red-500/40"
                            : state === "thinking"
                            ? "bg-white/20 text-white/50 cursor-wait"
                            : state === "speaking"
                            ? "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/30"
                            : "bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm hover:scale-105 shadow-white/10"
                    }`}
                >
                    {state === "thinking" ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : state === "listening" ? (
                        <MicOff className="h-6 w-6" />
                    ) : state === "speaking" ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Mic className="h-6 w-6" />
                    )}
                    {state === "listening" && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
                            <span className="absolute inset-[-4px] rounded-full border-2 border-red-400/30 animate-pulse" />
                        </>
                    )}
                </button>
                {state === "idle" && (
                    <span className="absolute -bottom-5 left-7 -translate-x-1/2 text-[10px] text-white/30 whitespace-nowrap pointer-events-none">Hold to talk</span>
                )}

                {/* Text toggle */}
                <button
                    onClick={() => setShowTextInput(!showTextInput)}
                    aria-label="Type your question"
                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm hover:scale-105"
                >
                    <MessageCircle className="h-4.5 w-4.5" />
                </button>

                {/* Cart button */}
                {itemCount > 0 && (
                    <button
                        onClick={() => {
                            // Dispatch event to open cart drawer
                            window.dispatchEvent(new CustomEvent("toggle-cart"));
                        }}
                        aria-label="View cart"
                        className="relative w-11 h-11 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center justify-center transition-all backdrop-blur-sm hover:scale-105 border border-emerald-500/20"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {itemCount}
                        </span>
                    </button>
                )}
            </div>

            {/* Expandable text input */}
            {showTextInput && (
                <form onSubmit={handleTextSubmit} className="mt-3 flex gap-2 w-full animate-fade-in">
                    <input
                        ref={textInputRef}
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Ask about properties, furniture..."
                        disabled={state === "thinking" || state === "speaking"}
                        className="flex-1 h-10 rounded-full bg-white/10 border border-white/20 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 backdrop-blur-sm"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!textInput.trim() || state === "thinking" || state === "speaking"}
                        className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            )}
        </div>
    );
}
