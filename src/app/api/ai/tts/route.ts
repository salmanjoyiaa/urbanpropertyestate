import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, AI_RATE_LIMITS } from "@/lib/rate-limit";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const VOICE_MODEL = "aura-2-thalia-en";

export async function POST(req: NextRequest) {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimit = checkRateLimit(clientIp, AI_RATE_LIMITS.general || { maxRequests: 20, windowMs: 60000 });
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    if (!DEEPGRAM_API_KEY) {
        return NextResponse.json({ error: "Deepgram API key not configured" }, { status: 500 });
    }

    try {
        const { text } = await req.json();

        if (!text || typeof text !== "string" || text.length > 2000) {
            return NextResponse.json({ error: "Invalid text (max 2000 chars)" }, { status: 400 });
        }

        const response = await fetch(
            `https://api.deepgram.com/v1/speak?model=${VOICE_MODEL}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${DEEPGRAM_API_KEY}`,
                },
                body: JSON.stringify({ text }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error("Deepgram TTS error:", response.status, errText);
            return NextResponse.json({ error: "TTS generation failed" }, { status: 502 });
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
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
