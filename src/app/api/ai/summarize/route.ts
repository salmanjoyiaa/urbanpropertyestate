import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api-helpers";
import { generateJSON } from "@/lib/ai/groq";
import { SUMMARIZER_SYSTEM_PROMPT, getSummarizerPrompt } from "@/lib/ai/prompts";
import type { ListingSummary } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimitResponse = applyRateLimit(request, "general");
        if (rateLimitResponse) return rateLimitResponse;

        const { description, price, currency } = await request.json();

        if (!description?.trim()) {
            return NextResponse.json(
                { error: "Property description is required" },
                { status: 400 }
            );
        }

        const summary = await generateJSON<ListingSummary>(
            getSummarizerPrompt(description, price, currency),
            {
                systemPrompt: SUMMARIZER_SYSTEM_PROMPT,
                temperature: 0.3,
                model: "FAST",
            }
        );

        // Ensure required fields exist with defaults
        const normalized: ListingSummary = {
            fields: summary.fields || [],
            redFlags: summary.redFlags || [],
            moveInCosts: summary.moveInCosts || "Not enough information to estimate",
            overallScore: summary.overallScore || 5,
        };

        return NextResponse.json(normalized);
    } catch (error: unknown) {
        console.error("Summarizer error:", error);
        const message = error instanceof Error ? error.message : "Summarization failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
