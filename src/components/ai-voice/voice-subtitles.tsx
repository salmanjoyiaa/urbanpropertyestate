"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Loader2, Volume2, User } from "lucide-react";
import type { OrbState } from "./voice-orb";

interface VoiceSubtitlesProps {
    state: OrbState;
    transcript: string;
    response: string;
    speakingWordIndex: number;
    audioPlaying: boolean;
}

export default function VoiceSubtitles({ state, transcript, response, speakingWordIndex, audioPlaying }: VoiceSubtitlesProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [displayedWords, setDisplayedWords] = useState<string[]>([]);
    const [showCustomerText, setShowCustomerText] = useState("");
    const prevResponseRef = useRef("");

    // Show customer transcript after they finish speaking (thinking/speaking phase)
    useEffect(() => {
        if ((state === "thinking" || state === "speaking") && transcript) {
            setShowCustomerText(transcript);
        }
    }, [state, transcript]);

    // Clear customer text after a while in idle
    useEffect(() => {
        if (state === "idle") {
            const timer = setTimeout(() => setShowCustomerText(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [state]);

    // Only start showing AI response words when audio actually starts playing
    useEffect(() => {
        if (!audioPlaying || !response || response === prevResponseRef.current) return;
        prevResponseRef.current = response;
        const words = response.split(" ");
        setDisplayedWords([]);
        let index = 0;
        const interval = setInterval(() => {
            if (index < words.length) {
                setDisplayedWords((prev) => [...prev, words[index]]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 75);
        return () => clearInterval(interval);
    }, [response, audioPlaying]);

    // Reset displayed words after idle timeout
    useEffect(() => {
        if (state === "idle") {
            const timer = setTimeout(() => {
                setDisplayedWords([]);
                prevResponseRef.current = "";
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [state]);

    // Auto-scroll
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [displayedWords, speakingWordIndex]);

    // Idle state with no history
    if (state === "idle" && displayedWords.length === 0 && !showCustomerText) {
        return (
            <div className="text-center mt-3">
                <p className="text-xs text-white/40 font-medium tracking-wide uppercase">
                    Hold the mic to talk
                </p>
            </div>
        );
    }

    return (
        <div className="mt-3 w-full max-w-sm mx-auto space-y-2">
            {/* Customer transcript bubble (right-aligned like a chat) */}
            {showCustomerText && (state === "thinking" || state === "speaking" || state === "idle") && (
                <div className="flex justify-end animate-fade-in">
                    <div className="flex items-start gap-2 max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-white/[0.12] border border-white/10 backdrop-blur-sm">
                        <p className="text-sm text-white/80 leading-relaxed">{showCustomerText}</p>
                        <User className="h-3.5 w-3.5 text-white/50 shrink-0 mt-0.5" />
                    </div>
                </div>
            )}

            {/* Listening — live mic indicator */}
            {state === "listening" && (
                <div className="flex items-center justify-center animate-fade-in">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/15 border border-red-500/20 backdrop-blur-sm">
                        <Mic className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                        <p className="text-sm text-red-200 font-medium">
                            {transcript || "Listening..."}
                        </p>
                        <span className="flex gap-0.5 ml-1">
                            {[0, 1, 2].map((i) => (
                                <span key={i} className="w-1 h-1 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </span>
                    </div>
                </div>
            )}

            {/* Thinking dots */}
            {state === "thinking" && (
                <div className="flex justify-start animate-fade-in">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/15 backdrop-blur-sm">
                        <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                        <p className="text-sm text-amber-200/80">Thinking...</p>
                    </div>
                </div>
            )}

            {/* Agent speaking — word-by-word subtitles (left-aligned like a chat reply) */}
            {(state === "speaking" || (state === "idle" && displayedWords.length > 0)) && (
                <div className="flex justify-start animate-fade-in">
                    <div
                        ref={containerRef}
                        className="max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-gradient-to-br from-blue-500/[0.12] to-purple-500/[0.08] border border-blue-400/15 backdrop-blur-md max-h-28 overflow-y-auto scrollbar-hide"
                    >
                        <div className="flex items-start gap-2">
                            <Volume2 className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-white/90 leading-relaxed">
                                {displayedWords.map((word, idx) => (
                                    <span
                                        key={idx}
                                        className={`inline-block mr-1 transition-all duration-200 ${
                                            idx === speakingWordIndex
                                                ? "text-white font-semibold"
                                                : idx < speakingWordIndex
                                                ? "text-white/60"
                                                : "text-white/85"
                                        }`}
                                        style={{ animation: `wordFadeIn 0.18s ease-out ${idx * 0.02}s both` }}
                                    >
                                        {word}
                                    </span>
                                ))}
                                {state === "speaking" && (
                                    <span className="inline-block w-0.5 h-3.5 bg-purple-400/70 animate-pulse ml-0.5 align-middle rounded-full" />
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
