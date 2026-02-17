import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, sanitizeInput, AI_RATE_LIMITS } from "@/lib/rate-limit";

async function qualifyLeadAsync(
    leadId: string,
    message: string,
    propertyId: string | null,
    source: string
) {
    try {
        // Call the AI leads qualification endpoint internally
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000";

        const res = await fetch(`${baseUrl}/api/ai/leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                propertyId,
                engagementHistory: { source },
            }),
        });

        if (!res.ok) return;

        const classification = await res.json();
        if (!classification.temperature) return;

        const supabase = createClient();
        await supabase
            .from("leads")
            .update({
                temperature: classification.temperature,
                score: classification.score,
                ai_reasons: classification.reasons || [],
                suggested_follow_up: classification.suggestedFollowUp || null,
                follow_up_delay: classification.followUpDelay || 1440,
            })
            .eq("id", leadId);
    } catch (err) {
        console.error("qualifyLeadAsync error:", err);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { property_id, agent_id, contact_name, contact_phone, contact_email, message, source, metadata } = body;

        // Rate limiting
        const clientIp = request.headers.get("x-forwarded-for") || "unknown";
        const rateLimit = await checkRateLimit(clientIp, AI_RATE_LIMITS.leads);
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        if (!agent_id || !message) {
            return NextResponse.json({ error: "Agent ID and message are required" }, { status: 400 });
        }

        const supabase = createClient();

        const { data, error } = await supabase
            .from("leads")
            .insert({
                property_id: property_id || null,
                agent_id,
                contact_name: sanitizeInput(contact_name || "", 100) || null,
                contact_phone: sanitizeInput(contact_phone || "", 20) || null,
                contact_email: sanitizeInput(contact_email || "", 100) || null,
                message: sanitizeInput(message, 1000),
                source: source || "form",
                temperature: "warm",
                score: 50,
                status: "new",
                notes: metadata ? JSON.stringify(metadata) : null,
            })
            .select()
            .single();

        if (error) {
            console.error("Lead insert error:", error);
            return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
        }

        // AI qualification — async, non-blocking
        // Updates the lead with AI-computed temperature, score, reasons
        qualifyLeadAsync(data.id, message, property_id, source).catch((err) =>
            console.error("AI lead qualification failed (non-blocking):", err)
        );

        return NextResponse.json({ success: true, lead: data });
    } catch (error) {
        console.error("Leads API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
