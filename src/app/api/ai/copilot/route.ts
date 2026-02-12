import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api-helpers";
import { generateJSON } from "@/lib/ai/groq";
import {
    COPILOT_SYSTEM_PROMPT,
    getCopilotPrompt,
    TRANSLATION_SYSTEM_PROMPT,
    getTranslationPrompt,
} from "@/lib/ai/prompts";
import { quickComplianceCheck } from "@/lib/ai/compliance";
import type { CopilotRequest, CopilotResponse } from "@/lib/ai/types";

const MARKET_LANGUAGES: Record<string, string[]> = {
    gcc: ["en", "ar"],
    eu: ["en", "es", "it", "fr"],
};

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimitResponse = applyRateLimit(request, "copilot");
        if (rateLimitResponse) return rateLimitResponse;

        const body: CopilotRequest = await request.json();
        const { bulletPoints, tone, languages: requestedLangs, propertyData } = body;

        if (!bulletPoints?.trim()) {
            return NextResponse.json(
                { error: "Bullet points are required" },
                { status: 400 }
            );
        }

        // Resolve languages from market region or custom selection
        let languages = requestedLangs || ["en"];
        if (languages.includes("gcc")) {
            languages = Array.from(new Set([...languages.filter(l => l !== "gcc"), ...MARKET_LANGUAGES.gcc]));
        }
        if (languages.includes("eu")) {
            languages = Array.from(new Set([...languages.filter(l => l !== "eu"), ...MARKET_LANGUAGES.eu]));
        }

        // Generate listing in English first
        const prompt = getCopilotPrompt(bulletPoints, tone || "premium", propertyData as Record<string, unknown>);
        const generated = await generateJSON<{ title: string; description: string }>(
            prompt,
            { systemPrompt: COPILOT_SYSTEM_PROMPT, temperature: 0.7 }
        );

        // Run compliance check on generated content
        const complianceResult = quickComplianceCheck(
            `${generated.title} ${generated.description}`
        );

        if (!complianceResult.passed) {
            return NextResponse.json({
                error: "Generated content contains compliance issues",
                violations: complianceResult.violations,
                generated, // Still return so user can edit
            }, { status: 422 });
        }

        // Generate translations for non-English languages
        const translations: Record<string, { title: string; description: string }> = {};
        const nonEnglish = languages.filter((l) => l !== "en");

        for (const lang of nonEnglish) {
            try {
                const translated = await generateJSON<{ title: string; description: string }>(
                    getTranslationPrompt(generated.title, generated.description, lang),
                    { systemPrompt: TRANSLATION_SYSTEM_PROMPT, temperature: 0.3 }
                );
                translations[lang] = translated;
            } catch {
                translations[lang] = {
                    title: `[Translation pending - ${lang}]`,
                    description: `[Translation pending - ${lang}]`,
                };
            }
        }

        const response: CopilotResponse = {
            title: generated.title,
            description: generated.description,
            translations,
        };

        return NextResponse.json(response);
    } catch (error: unknown) {
        console.error("Copilot error:", error);
        const message = error instanceof Error ? error.message : "AI generation failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
