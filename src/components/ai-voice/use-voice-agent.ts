"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export interface CartItem {
    type: "property" | "marketplace";
    id: string;
    title: string;
    price: number;
    currency: string;
    image?: string;
    agentPhone?: string;
    agentName?: string;
    city?: string;
}

interface VoiceAgentReturn {
    state: VoiceState;
    transcript: string;
    response: string;
    speakingWordIndex: number;
    audioPlaying: boolean;
    cart: CartItem[];
    audioContext: AudioContext | null;
    analyserNode: AnalyserNode | null;
    micAnalyser: AnalyserNode | null;
    startListening: () => Promise<void>;
    stopListening: () => void;
    sendTextQuery: (text: string) => Promise<void>;
    cancel: () => void;
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
}

export function useVoiceAgent(): VoiceAgentReturn {
    const [state, setState] = useState<VoiceState>("idle");
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [speakingWordIndex, setSpeakingWordIndex] = useState(0);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animFrameRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const conversationRef = useRef<Array<{ role: string; content: string }>>([]);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const micAnalyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const connectedAudiosRef = useRef<Set<HTMLAudioElement>>(new Set());

    // Initialize AudioContext lazily
    const getAudioContext = useCallback(() => {
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") return audioCtxRef.current;
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
        analyser.connect(ctx.destination);
        setAudioContext(ctx);
        setAnalyserNode(analyser);
        return ctx;
    }, []);

    const cleanup = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = 0;
        }
        sourceRef.current = null;
        setMicAnalyser(null);
        micAnalyserRef.current = null;
    }, []);

    const cancel = useCallback(() => {
        cleanup();
        setState("idle");
        setSpeakingWordIndex(0);
        setAudioPlaying(false);
    }, [cleanup]);

    // Cart operations
    const addToCart = useCallback((item: CartItem) => {
        setCart((prev) => {
            if (prev.find((c) => c.id === item.id && c.type === item.type)) return prev;
            return [...prev, item];
        });
    }, []);

    const removeFromCart = useCallback((id: string) => {
        setCart((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const clearCart = useCallback(() => setCart([]), []);

    // TTS via Deepgram Aura → /api/ai/tts
    const speakResponse = useCallback(
        (text: string): Promise<void> => {
            return new Promise(async (resolve) => {
                try {
                    const res = await fetch("/api/ai/tts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text }),
                    });
                    if (!res.ok) throw new Error("TTS request failed");

                    const audioBlob = await res.blob();
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    audioRef.current = audio;
                    const words = text.split(" ");

                    // Connect to AudioContext analyser for orb visualization
                    const ctx = getAudioContext();
                    if (ctx.state === "suspended") await ctx.resume();

                    audio.onplay = () => {
                        setAudioPlaying(true);
                        // Connect audio element to analyser (only once per element)
                        if (analyserRef.current && !connectedAudiosRef.current.has(audio)) {
                            try {
                                const source = ctx.createMediaElementSource(audio);
                                source.connect(analyserRef.current);
                                sourceRef.current = source;
                                connectedAudiosRef.current.add(audio);
                            } catch {
                                // Already connected or can't connect
                            }
                        }

                        const animate = () => {
                            if (!audioRef.current || audio.paused || audio.ended) return;
                            const progress = audio.duration ? audio.currentTime / audio.duration : 0;
                            const wordIdx = Math.min(Math.floor(progress * words.length), words.length - 1);
                            setSpeakingWordIndex(wordIdx);
                            animFrameRef.current = requestAnimationFrame(animate);
                        };
                        animFrameRef.current = requestAnimationFrame(animate);
                    };

                    audio.onended = () => {
                        setSpeakingWordIndex(words.length);
                        setAudioPlaying(false);
                        URL.revokeObjectURL(audioUrl);
                        audioRef.current = null;
                        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                        resolve();
                    };

                    audio.onerror = () => {
                        setAudioPlaying(false);
                        URL.revokeObjectURL(audioUrl);
                        audioRef.current = null;
                        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                        resolve();
                    };

                    audio.play().catch(() => {
                        // Autoplay blocked — fallback to timed text display
                        setAudioPlaying(true);
                        const wordDelay = Math.max(text.length * 50, 2000);
                        let wIdx = 0;
                        const wInterval = setInterval(() => {
                            if (wIdx < words.length) {
                                setSpeakingWordIndex(wIdx);
                                wIdx++;
                            } else {
                                clearInterval(wInterval);
                                setAudioPlaying(false);
                                resolve();
                            }
                        }, wordDelay / words.length);
                    });
                } catch {
                    // TTS unavailable — fallback to browser SpeechSynthesis
                    if ("speechSynthesis" in window) {
                        const utterance = new SpeechSynthesisUtterance(text);
                        const voices = window.speechSynthesis.getVoices();
                        const preferred = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google")));
                        if (preferred) utterance.voice = preferred;
                        utterance.rate = 1.0;
                        const uWords = text.split(" ");
                        let wIdx = 0;
                        utterance.onstart = () => { setAudioPlaying(true); };
                        utterance.onboundary = (e) => {
                            if (e.name === "word") { wIdx++; setSpeakingWordIndex(wIdx); }
                        };
                        utterance.onend = () => { setSpeakingWordIndex(uWords.length); setAudioPlaying(false); resolve(); };
                        utterance.onerror = () => { setAudioPlaying(false); resolve(); };
                        window.speechSynthesis.speak(utterance);
                    } else {
                        // Last resort: timed text
                        setAudioPlaying(true);
                        const words = text.split(" ");
                        let wIdx = 0;
                        const wInterval = setInterval(() => {
                            if (wIdx < words.length) { setSpeakingWordIndex(wIdx); wIdx++; }
                            else { clearInterval(wInterval); setAudioPlaying(false); resolve(); }
                        }, 100);
                    }
                }
            });
        },
        [getAudioContext]
    );

    // Process query through AI receptionist
    const processQuery = useCallback(
        async (query: string) => {
            setState("thinking");
            setResponse("");
            setSpeakingWordIndex(0);
            try {
                conversationRef.current.push({ role: "user", content: query });
                const res = await fetch("/api/ai/receptionist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: query,
                        history: conversationRef.current.slice(-10),
                    }),
                });
                if (!res.ok) throw new Error("AI request failed");
                const data = await res.json();
                const aiText = data.message || "I couldn't process that. Please try again.";
                conversationRef.current.push({ role: "assistant", content: aiText });
                setResponse(aiText);

                // Handle cart actions from AI
                if (data.cartAction && data.cartAction.action === "add") {
                    const items = [...(data.listings || []), ...(data.marketplaceItems || [])];
                    const target = items.find((it: Record<string, unknown>) => it.id === data.cartAction.itemId);
                    if (target) {
                        addToCart({
                            type: data.cartAction.itemType || "property",
                            id: target.id,
                            title: target.title,
                            price: target.rent || target.price,
                            currency: target.currency || "AED",
                            image: target.property_photos?.[0]?.url || target.household_item_photos?.[0]?.url,
                            agentPhone: target.agent?.whatsapp_number || target.seller?.whatsapp_number,
                            agentName: target.agent?.name || target.seller?.name,
                            city: target.city,
                        });
                    }
                }

                // Handle automatic cart adds (when AI lists items and user says "add")
                if (data.listings?.length && !data.cartAction) {
                    // Store available listings in context for follow-up commands
                    conversationRef.current.push({
                        role: "system",
                        content: `[Available listings: ${data.listings.map((l: Record<string, unknown>, i: number) => `${i + 1}. ${l.title} (${l.id})`).join(", ")}]`,
                    });
                }

                if (data.marketplaceItems?.length && !data.cartAction) {
                    conversationRef.current.push({
                        role: "system",
                        content: `[Available marketplace items: ${data.marketplaceItems.map((l: Record<string, unknown>, i: number) => `${i + 1}. ${l.title} (${l.id})`).join(", ")}]`,
                    });
                }

                // Auto-capture lead when user shows strong interest
                if (data.intent === "booking" || data.captureLeadInfo) {
                    try {
                        const leadPayload = {
                            agent_id: data.listings?.[0]?.agent_id || data.marketplaceItems?.[0]?.seller_id || null,
                            message: query,
                            source: "ai_voice",
                            contact_name: data.captureLeadInfo?.name || null,
                            contact_phone: data.captureLeadInfo?.phone || null,
                            property_id: data.listings?.[0]?.id || null,
                        };
                        if (leadPayload.agent_id) {
                            fetch("/api/leads", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(leadPayload),
                            }).catch(() => {});
                        }
                    } catch {
                        // Non-blocking
                    }
                }

                setState("speaking");
                await speakResponse(aiText);
                setState("idle");
            } catch (err) {
                console.error("AI query error:", err);
                setResponse("Sorry, I had trouble processing that. Please try again.");
                setState("idle");
            }
        },
        [speakResponse, addToCart]
    );

    // Start mic recording
    const startListening = useCallback(async () => {
        try {
            cleanup();
            chunksRef.current = [];
            setTranscript("");
            const ctx = getAudioContext();
            if (ctx.state === "suspended") await ctx.resume();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true },
            });
            streamRef.current = stream;

            // Create analyser for mic input (for orb visualization)
            const micAn = ctx.createAnalyser();
            micAn.fftSize = 128;
            micAn.smoothingTimeConstant = 0.8;
            const micSource = ctx.createMediaStreamSource(stream);
            micSource.connect(micAn);
            micAnalyserRef.current = micAn;
            setMicAnalyser(micAn);

            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm")
                ? "audio/webm"
                : "audio/mp4";
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                setMicAnalyser(null);
                micAnalyserRef.current = null;
                if (chunksRef.current.length === 0) { setState("idle"); return; }
                const audioBlob = new Blob(chunksRef.current, { type: mimeType });
                setState("thinking");
                try {
                    const res = await fetch("/api/ai/speech", {
                        method: "POST",
                        headers: { "Content-Type": mimeType },
                        body: audioBlob,
                    });
                    if (!res.ok) throw new Error("Transcription failed");
                    const { transcript: text } = await res.json();
                    if (!text?.trim()) {
                        setTranscript("(couldn't hear you)");
                        setState("idle");
                        return;
                    }
                    setTranscript(text);
                    await processQuery(text);
                } catch (err) {
                    console.error("Transcription error:", err);
                    setTranscript("(transcription failed)");
                    setState("idle");
                }
            };

            recorder.start(250);
            setState("listening");
        } catch (err) {
            console.error("Microphone error:", err);
            setState("idle");
        }
    }, [cleanup, processQuery, getAudioContext]);

    const stopListening = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const sendTextQuery = useCallback(
        async (text: string) => {
            setTranscript(text);
            await processQuery(text);
        },
        [processQuery]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
            if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
                audioCtxRef.current.close().catch(() => {});
            }
        };
    }, [cleanup]);

    return {
        state,
        transcript,
        response,
        speakingWordIndex,
        audioPlaying,
        cart,
        audioContext,
        analyserNode,
        micAnalyser,
        startListening,
        stopListening,
        sendTextQuery,
        cancel,
        addToCart,
        removeFromCart,
        clearCart,
    };
}
