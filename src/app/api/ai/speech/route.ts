import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "general");
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Speech service not configured" },
                { status: 503 }
            );
        }

        const contentType = request.headers.get("content-type") || "audio/webm";
        const audioBuffer = await request.arrayBuffer();

        if (audioBuffer.byteLength === 0) {
            return NextResponse.json(
                { error: "No audio data received" },
                { status: 400 }
            );
        }

        // Stream audio to Deepgram REST API
        const dgResponse = await fetch(
            "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en",
            {
                method: "POST",
                headers: {
                    Authorization: `Token ${apiKey}`,
                    "Content-Type": contentType,
                },
                body: audioBuffer,
            }
        );

        if (!dgResponse.ok) {
            const errText = await dgResponse.text();
            console.error("Deepgram error:", errText);
            return NextResponse.json(
                { error: "Speech recognition failed" },
                { status: 502 }
            );
        }

        const result = await dgResponse.json();
        const transcript =
            result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

        return NextResponse.json({ transcript });
    } catch (error) {
        console.error("Speech API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
