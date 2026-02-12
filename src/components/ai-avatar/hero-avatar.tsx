"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Mic, MicOff, Loader2, MessageCircle, Send, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AvatarModel from "./avatar-model";
import { useSpeechEngine, type AvatarState } from "./use-speech-engine";

// Detect WebGL support
function isWebGLAvailable(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const canvas = document.createElement("canvas");
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
    } catch {
        return false;
    }
}

const STATE_LABELS: Record<AvatarState, string> = {
    idle: "Click the mic to ask me anything",
    listening: "Listening... click to stop",
    thinking: "Thinking...",
    speaking: "Speaking...",
};

function AvatarScene({
    isSpeaking,
    speakingText,
    isListening,
}: {
    isSpeaking: boolean;
    speakingText: string;
    isListening: boolean;
}) {
    return (
        <Canvas
            camera={{ position: [0, 0.55, 1.8], fov: 26 }}
            style={{ width: "100%", height: "100%" }}
            gl={{ antialias: true, alpha: true, toneMapping: 3 }}
            dpr={[1, 2]}
        >
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 4, 5]} intensity={1.2} color="#fff5ee" />
            <directionalLight position={[-2, 2, -3]} intensity={0.4} color="#e8e0ff" />
            <spotLight position={[0, 5, 2]} angle={0.4} penumbra={0.8} intensity={0.6} color="#ffffff" />

            <Suspense fallback={null}>
                <AvatarModel
                    isSpeaking={isSpeaking}
                    speakingText={speakingText}
                    isListening={isListening}
                />
                <Environment preset="apartment" />
                <ContactShadows
                    position={[0, -1.55, 0]}
                    opacity={0.4}
                    scale={3}
                    blur={2}
                />
            </Suspense>

            <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 2.5}
                maxPolarAngle={Math.PI / 1.8}
                minAzimuthAngle={-Math.PI / 8}
                maxAzimuthAngle={Math.PI / 8}
                target={[0, 0.5, 0]}
            />
        </Canvas>
    );
}

function FallbackAvatar({ state }: { state: AvatarState }) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="relative">
                {/* Simple animated avatar circle */}
                <div
                    className={`w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-2xl transition-all duration-300 ${
                        state === "listening"
                            ? "ring-4 ring-blue-400/50 animate-pulse"
                            : state === "speaking"
                                ? "ring-4 ring-purple-400/50 scale-105"
                                : ""
                    }`}
                >
                    <MessageCircle className="h-14 w-14 text-white" />
                </div>
                {state === "speaking" && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function HeroAvatar() {
    const [webglSupported, setWebglSupported] = useState(true);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState("");
    const textInputRef = useRef<HTMLInputElement>(null);

    const {
        state,
        transcript,
        response,
        speakingText,
        startListening,
        stopListening,
        sendTextQuery,
        cancel,
    } = useSpeechEngine();

    useEffect(() => {
        setWebglSupported(isWebGLAvailable());
    }, []);

    useEffect(() => {
        if (showTextInput && textInputRef.current) {
            textInputRef.current.focus();
        }
    }, [showTextInput]);

    const handleMicClick = () => {
        if (state === "listening") {
            stopListening();
        } else if (state === "speaking") {
            cancel();
        } else {
            startListening();
        }
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim() || state === "thinking" || state === "speaking") return;
        sendTextQuery(textInput.trim());
        setTextInput("");
        setShowTextInput(false);
    };

    return (
        <div className="relative flex flex-col items-center">
            {/* 3D Avatar or Fallback */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64">
                {/* Glow ring behind avatar */}
                <div
                    className={`absolute inset-0 rounded-full transition-all duration-500 ${
                        state === "listening"
                            ? "bg-blue-500/20 shadow-[0_0_60px_rgba(59,130,246,0.4)] animate-pulse"
                            : state === "speaking"
                                ? "bg-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,0.4)]"
                                : state === "thinking"
                                    ? "bg-amber-500/10 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                                    : "bg-white/5"
                    }`}
                />

                {/* Avatar canvas */}
                <div className="relative w-full h-full rounded-full overflow-hidden">
                    {webglSupported ? (
                        <AvatarScene
                            isSpeaking={state === "speaking"}
                            speakingText={speakingText}
                            isListening={state === "listening"}
                        />
                    ) : (
                        <FallbackAvatar state={state} />
                    )}
                </div>
            </div>

            {/* Status text */}
            <div className="mt-3 text-center min-h-[3rem]">
                {state === "listening" && transcript && (
                    <p className="text-sm text-blue-300 animate-pulse">&quot;{transcript}&quot;</p>
                )}
                {state === "thinking" && (
                    <div className="flex items-center gap-2 text-sm text-amber-300">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Thinking...
                    </div>
                )}
                {state === "speaking" && response && (
                    <div className="max-w-xs">
                        <div className="flex items-start gap-2 text-sm text-white/90 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
                            <Volume2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-300" />
                            <p className="line-clamp-3">{response}</p>
                        </div>
                    </div>
                )}
                {state === "idle" && response && (
                    <div className="max-w-xs">
                        <p className="text-xs text-white/60 line-clamp-2">{response}</p>
                    </div>
                )}
                {state === "idle" && !response && (
                    <p className="text-xs text-white/50">{STATE_LABELS.idle}</p>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-3">
                {/* Mic button */}
                <button
                    onClick={handleMicClick}
                    disabled={state === "thinking"}
                    aria-label={state === "listening" ? "Stop listening" : "Start voice query"}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                        state === "listening"
                            ? "bg-red-500 hover:bg-red-600 text-white scale-110"
                            : state === "thinking"
                                ? "bg-white/20 text-white/50 cursor-wait"
                                : state === "speaking"
                                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                                    : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm hover:scale-105"
                    }`}
                >
                    {state === "thinking" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : state === "listening" ? (
                        <MicOff className="h-5 w-5" />
                    ) : state === "speaking" ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Mic className="h-5 w-5" />
                    )}

                    {/* Pulse ring when listening */}
                    {state === "listening" && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                            <span className="absolute inset-[-4px] rounded-full border-2 border-red-400/40 animate-pulse" />
                        </>
                    )}
                </button>

                {/* Text input toggle */}
                <button
                    onClick={() => setShowTextInput(!showTextInput)}
                    aria-label="Type your question"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm"
                >
                    <MessageCircle className="h-4 w-4" />
                </button>
            </div>

            {/* Text input (expandable) */}
            {showTextInput && (
                <form
                    onSubmit={handleTextSubmit}
                    className="mt-3 flex gap-2 w-full max-w-xs animate-fade-in"
                >
                    <input
                        ref={textInputRef}
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type your question..."
                        disabled={state === "thinking" || state === "speaking"}
                        className="flex-1 h-9 rounded-full bg-white/10 border border-white/20 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!textInput.trim() || state === "thinking" || state === "speaking"}
                        className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </Button>
                </form>
            )}
        </div>
    );
}
