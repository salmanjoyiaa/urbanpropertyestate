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
    const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
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
        if (synthRef.current) {
            window.speechSynthesis.cancel();
        }
    }, []);

    const cancel = useCallback(() => {
        cleanup();
        setState("idle");
        setSpeakingText("");
    }, [cleanup]);

    // Text-to-speech with viseme-driving callback
    const speakResponse = useCallback((text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!("speechSynthesis" in window)) {
                // No TTS support — just show text
                setSpeakingText(text);
                setTimeout(() => {
                    setSpeakingText("");
                    resolve();
                }, text.length * 60); // rough timing
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            synthRef.current = utterance;

            // Pick a natural voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(
                (v) =>
                    v.lang.startsWith("en") &&
                    (v.name.includes("Natural") ||
                        v.name.includes("Google") ||
                        v.name.includes("Samantha") ||
                        v.name.includes("Daniel"))
            );
            if (preferred) utterance.voice = preferred;

            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Drive lip sync by feeding progressively longer slices of text
            const words = text.split(" ");
            let wordIndex = 0;

            utterance.onboundary = (event) => {
                if (event.name === "word") {
                    wordIndex++;
                    // Feed the current word segment for viseme generation
                    const currentSegment = words.slice(Math.max(0, wordIndex - 3), wordIndex + 1).join(" ");
                    setSpeakingText(currentSegment);
                }
            };

            utterance.onstart = () => {
                setSpeakingText(words.slice(0, 3).join(" "));
            };

            utterance.onend = () => {
                setSpeakingText("");
                synthRef.current = null;
                resolve();
            };

            utterance.onerror = () => {
                setSpeakingText("");
                synthRef.current = null;
                resolve();
            };

            window.speechSynthesis.speak(utterance);
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
