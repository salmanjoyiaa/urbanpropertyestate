"use client";

import { useState, useRef, useCallback } from "react";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface UseSpeechEngineReturn {
    state: AvatarState;
    transcript: string;
    response: string;
    speakingText: string;
    startListening: () => Promise<void>;
    stopListening: () => void;
    sendTextQuery: (text: string) => Promise<void>;
    cancel: () => void;
}

export function useSpeechEngine(): UseSpeechEngineReturn {
    const [state, setState] = useState<AvatarState>("idle");
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [speakingText, setSpeakingText] = useState("");

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animFrameRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const conversationRef = useRef<Array<{ role: string; content: string }>>([]);

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
    }, []);

    const cancel = useCallback(() => {
        cleanup();
        setState("idle");
        setSpeakingText("");
    }, [cleanup]);

    // Text-to-speech via ElevenLabs with lip-sync timing
    const speakResponse = useCallback((text: string): Promise<void> => {
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

                audio.onplay = () => {
                    // Lip-sync loop: map audio progress to word position
                    const animate = () => {
                        if (!audioRef.current || audio.paused || audio.ended) return;
                        const progress = audio.duration
                            ? audio.currentTime / audio.duration
                            : 0;
                        const wordIdx = Math.floor(progress * words.length);
                        const segment = words
                            .slice(Math.max(0, wordIdx - 1), wordIdx + 2)
                            .join(" ");
                        setSpeakingText(segment);
                        animFrameRef.current = requestAnimationFrame(animate);
                    };
                    animFrameRef.current = requestAnimationFrame(animate);
                };

                audio.onended = () => {
                    setSpeakingText("");
                    URL.revokeObjectURL(audioUrl);
                    audioRef.current = null;
                    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                    resolve();
                };

                audio.onerror = () => {
                    setSpeakingText("");
                    URL.revokeObjectURL(audioUrl);
                    audioRef.current = null;
                    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                    resolve();
                };

                audio.play().catch(() => {
                    // Autoplay blocked — fallback to showing text only
                    setSpeakingText(text);
                    setTimeout(() => {
                        setSpeakingText("");
                        resolve();
                    }, Math.max(text.length * 60, 3000));
                });
            } catch {
                // ElevenLabs unavailable — fallback to browser SpeechSynthesis
                if ("speechSynthesis" in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    const voices = window.speechSynthesis.getVoices();
                    const preferred = voices.find(
                        (v) =>
                            v.lang.startsWith("en") &&
                            (v.name.includes("Natural") ||
                                v.name.includes("Google") ||
                                v.name.includes("Samantha"))
                    );
                    if (preferred) utterance.voice = preferred;
                    utterance.rate = 1.0;
                    const uWords = text.split(" ");
                    let wIdx = 0;
                    utterance.onboundary = (e) => {
                        if (e.name === "word") {
                            wIdx++;
                            setSpeakingText(
                                uWords.slice(Math.max(0, wIdx - 2), wIdx + 1).join(" ")
                            );
                        }
                    };
                    utterance.onstart = () => setSpeakingText(uWords.slice(0, 2).join(" "));
                    utterance.onend = () => { setSpeakingText(""); resolve(); };
                    utterance.onerror = () => { setSpeakingText(""); resolve(); };
                    window.speechSynthesis.speak(utterance);
                } else {
                    setSpeakingText(text);
                    setTimeout(() => { setSpeakingText(""); resolve(); }, text.length * 60);
                }
            }
        });
    }, []);

    // Send query to AI receptionist and speak the response
    const processQuery = useCallback(
        async (query: string) => {
            setState("thinking");
            setResponse("");

            try {
                // Add to conversation history
                conversationRef.current.push({ role: "user", content: query });

                const res = await fetch("/api/ai/receptionist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: query,
                        history: conversationRef.current.slice(-6),
                    }),
                });

                if (!res.ok) throw new Error("AI request failed");

                const data = await res.json();
                const aiText = data.reply || data.message || "I couldn't process that. Please try again.";

                conversationRef.current.push({ role: "assistant", content: aiText });
                setResponse(aiText);

                // Speak the response
                setState("speaking");
                await speakResponse(aiText);
                setState("idle");
            } catch (err) {
                console.error("AI query error:", err);
                setResponse("Sorry, I had trouble processing that. Please try again.");
                setState("idle");
            }
        },
        [speakResponse]
    );

    // Start recording from microphone
    const startListening = useCallback(async () => {
        try {
            cleanup();
            chunksRef.current = [];
            setTranscript("");

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true },
            });
            streamRef.current = stream;

            // Check for supported mime types
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

                if (chunksRef.current.length === 0) {
                    setState("idle");
                    return;
                }

                const audioBlob = new Blob(chunksRef.current, { type: mimeType });

                // Transcribe via Deepgram proxy
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

            recorder.start(250); // collect data every 250ms
            setState("listening");
        } catch (err) {
            console.error("Microphone error:", err);
            setState("idle");
        }
    }, [cleanup, processQuery]);

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

    return {
        state,
        transcript,
        response,
        speakingText,
        startListening,
        stopListening,
        sendTextQuery,
        cancel,
    };
}
