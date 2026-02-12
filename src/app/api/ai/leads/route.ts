import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/groq";
import type { LeadClassification } from "@/lib/ai/types";

const LEAD_SYSTEM_PROMPT = `You are a real estate lead qualification assistant. Classify inbound leads based on their message content and engagement signals.

CLASSIFICATION:
- HOT (80-100): Specific property interest, mentions budget, move-in timeframe, asks about viewing
- WARM (40-79): General interest, browsing multiple properties, asks general questions  
- COLD (0-39): Vague inquiry, no specific interest, may be spam or casual browsing

Always respond in valid JSON format.`;

export async function POST(request: NextRequest) {
    try {
        const { message, propertyId, responseTime, engagementHistory } = await request.json();

        if (!message?.trim()) {
            return NextResponse.json(
                { error: "Lead message is required" },
                { status: 400 }
            );
        }

        // Rule-based scoring
        let ruleScore = 50;
        const reasons: string[] = [];

        // Keywords that indicate high intent
        const hotKeywords = ["viewing", "visit", "move in", "deposit", "sign", "lease", "contract", "when can i", "available", "book"];
        const warmKeywords = ["interested", "tell me more", "photos", "details", "price", "rent"];
        const coldKeywords = ["just looking", "maybe", "not sure", "sometime"];

        const lowerMessage = message.toLowerCase();

        for (const kw of hotKeywords) {
            if (lowerMessage.includes(kw)) {
                ruleScore += 10;
                reasons.push(`Mentions "${kw}" — high intent`);
            }
        }
        for (const kw of warmKeywords) {
            if (lowerMessage.includes(kw)) {
                ruleScore += 5;
                reasons.push(`Mentions "${kw}" — moderate intent`);
            }
        }
        for (const kw of coldKeywords) {
            if (lowerMessage.includes(kw)) {
                ruleScore -= 10;
                reasons.push(`Mentions "${kw}" — low intent`);
            }
        }

        // Response time factor
        if (responseTime) {
            if (responseTime < 60) {
                ruleScore += 10;
                reasons.push("Very fast response — high engagement");
            } else if (responseTime > 1440) {
                ruleScore -= 5;
                reasons.push("Slow response — may indicate low urgency");
            }
        }

        // Specific property mention
        if (propertyId) {
            ruleScore += 5;
            reasons.push("Inquiring about a specific property");
        }

        // AI enhancement
        try {
            const aiResult = await generateJSON<LeadClassification>(
                `Classify this lead inquiry:\n\nMESSAGE: "${message}"\n${propertyId ? `PROPERTY ID: ${propertyId}` : ""}\n${engagementHistory ? `HISTORY: ${JSON.stringify(engagementHistory)}` : ""}\n\nRespond in JSON:\n{"temperature": "hot|warm|cold", "score": 0-100, "reasons": ["reason1", "reason2"], "suggestedFollowUp": "what action to take", "followUpDelay": minutes_to_wait}`,
                {
                    systemPrompt: LEAD_SYSTEM_PROMPT,
                    temperature: 0.3,
                    model: "INSTANT",
                }
            );

            // Merge scores
            const finalScore = Math.min(Math.round((ruleScore + (aiResult.score || 50)) / 2), 100);

            const result: LeadClassification = {
                temperature: finalScore >= 80 ? "hot" : finalScore >= 40 ? "warm" : "cold",
                score: finalScore,
                reasons: [...reasons, ...(aiResult.reasons || [])].slice(0, 5),
                suggestedFollowUp: aiResult.suggestedFollowUp || getDefaultFollowUp(finalScore),
                followUpDelay: aiResult.followUpDelay || getDefaultDelay(finalScore),
            };

            return NextResponse.json(result);
        } catch {
            // Fall back to rule-based only
            const finalScore = Math.min(Math.max(ruleScore, 0), 100);
            const result: LeadClassification = {
                temperature: finalScore >= 80 ? "hot" : finalScore >= 40 ? "warm" : "cold",
                score: finalScore,
                reasons,
                suggestedFollowUp: getDefaultFollowUp(finalScore),
                followUpDelay: getDefaultDelay(finalScore),
            };
            return NextResponse.json(result);
        }
    } catch (error: unknown) {
        console.error("Lead qualification error:", error);
        const message = error instanceof Error ? error.message : "Lead qualification failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function getDefaultFollowUp(score: number): string {
    if (score >= 80) return "Respond immediately. Schedule a viewing and share property documents.";
    if (score >= 40) return "Send property details and ask about their timeline and preferences.";
    return "Add to nurture list. Send weekly property digest.";
}

function getDefaultDelay(score: number): number {
    if (score >= 80) return 60; // 1 hour
    if (score >= 40) return 1440; // 24 hours
    return 4320; // 72 hours
}
