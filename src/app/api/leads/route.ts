import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, sanitizeInput, AI_RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { property_id, agent_id, contact_name, contact_phone, contact_email, message, source, metadata } = body;

        // Rate limiting
        const clientIp = request.headers.get("x-forwarded-for") || "unknown";
        const rateLimit = checkRateLimit(clientIp, AI_RATE_LIMITS.leads);
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

        return NextResponse.json({ success: true, lead: data });
    } catch (error) {
        console.error("Leads API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
