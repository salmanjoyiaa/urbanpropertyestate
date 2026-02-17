import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api-helpers";
import { generateJSON } from "@/lib/ai/groq";
import { COMPLIANCE_SYSTEM_PROMPT, getCompliancePrompt } from "@/lib/ai/prompts";
import { quickComplianceCheck, fullComplianceCheck } from "@/lib/ai/compliance";
import type { ComplianceCheck } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimitResponse = await applyRateLimit(request, "general");
        if (rateLimitResponse) return rateLimitResponse;

        const { text, mode } = await request.json();

        if (!text?.trim()) {
            return NextResponse.json(
                { error: "Text to check is required" },
                { status: 400 }
            );
        }

        let result: ComplianceCheck;

        if (mode === "quick") {
            // Fast regex-only check (for real-time typing)
            result = quickComplianceCheck(text);
        } else {
            // Full AI-powered check (for pre-publish)
            result = await fullComplianceCheck(text);
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("Compliance check error:", error);
        const message = error instanceof Error ? error.message : "Compliance check failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
