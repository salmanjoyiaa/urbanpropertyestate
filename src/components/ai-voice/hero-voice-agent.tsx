"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Send, X, MessageCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceOrb from "./voice-orb";
import VoiceSubtitles from "./voice-subtitles";
import { useVoiceAgent } from "./use-voice-agent";
import { useCart } from "@/components/cart/cart-context";

export default function HeroVoiceAgent() {
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState("");
    const textInputRef = useRef<HTMLInputElement>(null);

    const {
        state,
        transcript,
        response,
        speakingWordIndex,
        cart: voiceCart,
        analyserNode,
        micAnalyser,
        startListening,
        stopListening,
        sendTextQuery,
        cancel,
        addToCart: voiceAddToCart,
    } = useVoiceAgent();

    const { addItem, itemCount } = useCart();

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

    const handleMicClick = () => {
        if (state === "listening") stopListening();
        else if (state === "speaking") cancel();
        else startListening();
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim() || state === "thinking" || state === "speaking") return;
        sendTextQuery(textInput.trim());
        setTextInput("");
        setShowTextInput(false);
    };

    return (
        <div className="relative flex flex-col items-center w-full max-w-sm mx-auto">
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
            />

            {/* Controls */}
            <div className="flex items-center gap-3 mt-4">
                {/* Mic button */}
                <button
                    onClick={handleMicClick}
                    disabled={state === "thinking"}
                    aria-label={state === "listening" ? "Stop listening" : "Start voice query"}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
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
