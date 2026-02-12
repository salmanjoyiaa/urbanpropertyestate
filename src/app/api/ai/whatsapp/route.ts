import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/groq";
import { WHATSAPP_SYSTEM_PROMPT, getWhatsAppPrompt } from "@/lib/ai/prompts";
import type { WhatsAppComposerResponse } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
    try {
        const { propertyTitle, propertyDetails, agentName } = await request.json();

        if (!propertyTitle || !agentName) {
            return NextResponse.json(
                { error: "Property title and agent name are required" },
                { status: 400 }
            );
        }

        const result = await generateJSON<WhatsAppComposerResponse>(
            getWhatsAppPrompt(propertyTitle, propertyDetails || {}, agentName),
            {
                systemPrompt: WHATSAPP_SYSTEM_PROMPT,
                temperature: 0.6,
                model: "INSTANT",
            }
        );

        // Ensure proper structure
        const response: WhatsAppComposerResponse = {
            messages: (result.messages || []).map((m) => ({
                intent: m.intent || "general",
                label: m.label || "Send Message",
                emoji: m.emoji || "💬",
                message: m.message || "",
            })),
            propertyContext: result.propertyContext || propertyTitle,
        };

        return NextResponse.json(response);
    } catch (error: unknown) {
        console.error("WhatsApp composer error:", error);
        const message = error instanceof Error ? error.message : "Message generation failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
