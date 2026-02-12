import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, AI_RATE_LIMITS } from "@/lib/rate-limit";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// "Rachel" — natural, warm female voice (default ElevenLabs voice)
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

export async function POST(req: NextRequest) {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimit = checkRateLimit(clientIp, AI_RATE_LIMITS.general || { maxRequests: 20, windowMs: 60000 });
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    if (!ELEVENLABS_API_KEY) {
        return NextResponse.json(
            { error: "ElevenLabs API key not configured" },
            { status: 500 }
        );
    }

    try {
        const { text } = await req.json();

        if (!text || typeof text !== "string" || text.length > 5000) {
            return NextResponse.json(
                { error: "Invalid text (max 5000 chars)" },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.3,
                        use_speaker_boost: true,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error("ElevenLabs error:", response.status, errText);
            return NextResponse.json(
                { error: "TTS generation failed" },
                { status: 502 }
            );
        }

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (err) {
        console.error("TTS route error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
