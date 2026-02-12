"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Loader2, Volume2 } from "lucide-react";
import type { OrbState } from "./voice-orb";

interface VoiceSubtitlesProps {
    state: OrbState;
    transcript: string;
    response: string;
    speakingWordIndex: number;
}

export default function VoiceSubtitles({ state, transcript, response, speakingWordIndex }: VoiceSubtitlesProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [displayedWords, setDisplayedWords] = useState<string[]>([]);
    const prevResponseRef = useRef("");

    // When response changes, animate words in one by one
    useEffect(() => {
        if (state !== "speaking" || !response || response === prevResponseRef.current) return;
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
        }, 80);
        return () => clearInterval(interval);
    }, [response, state]);

    // Reset on idle
    useEffect(() => {
        if (state === "idle") {
            const timer = setTimeout(() => setDisplayedWords([]), 3000);
            return () => clearTimeout(timer);
        }
    }, [state]);

    // Auto-scroll
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [displayedWords, speakingWordIndex]);

    if (state === "idle" && displayedWords.length === 0 && !transcript) {
        return (
            <div className="text-center mt-4">
                <p className="text-xs text-white/40 font-medium tracking-wide uppercase">
                    Click the mic to ask me anything
                </p>
            </div>
        );
    }

    return (
        <div className="mt-4 w-full max-w-sm mx-auto">
            {/* Listening — show live transcript */}
            {state === "listening" && (
                <div className="flex items-center gap-2 justify-center animate-fade-in">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-500/15 border border-red-500/20 backdrop-blur-sm">
                        <Mic className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                        <p className="text-sm text-red-200 font-medium">
                            {transcript || "Listening..."}
                        </p>
                        <span className="flex gap-0.5 ml-1">
                            {[0, 1, 2].map((i) => (
                                <span
                                    key={i}
                                    className="w-1 h-1 rounded-full bg-red-400 animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </span>
                    </div>
                </div>
            )}

            {/* Thinking — animated dots */}
            {state === "thinking" && (
                <div className="flex items-center gap-2 justify-center animate-fade-in">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/20 backdrop-blur-sm">
                        <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                        <p className="text-sm text-amber-200 font-medium">Thinking...</p>
                    </div>
                </div>
            )}

            {/* Speaking — word-by-word subtitle display */}
            {(state === "speaking" || (state === "idle" && displayedWords.length > 0)) && (
                <div
                    ref={containerRef}
                    className="relative px-4 py-3 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md max-h-24 overflow-y-auto scrollbar-hide animate-fade-in"
                >
                    <div className="flex items-start gap-2">
                        <Volume2 className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-1" />
                        <p className="text-sm text-white/90 leading-relaxed">
                            {displayedWords.map((word, idx) => (
                                <span
                                    key={idx}
                                    className={`inline-block mr-1 transition-all duration-200 ${
                                        idx === speakingWordIndex
                                            ? "text-white font-semibold scale-105"
                                            : idx < speakingWordIndex
                                            ? "text-white/70"
                                            : "text-white/90"
                                    }`}
                                    style={{
                                        animation: `wordFadeIn 0.2s ease-out ${idx * 0.03}s both`,
                                    }}
                                >
                                    {word}
                                </span>
                            ))}
                            {state === "speaking" && (
                                <span className="inline-block w-0.5 h-4 bg-purple-400 animate-pulse ml-0.5 align-middle" />
                            )}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
