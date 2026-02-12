import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/groq";
import { RECEPTIONIST_SYSTEM_PROMPT, buildReceptionistPrompt } from "@/lib/ai/receptionist-prompts";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, sanitizeInput, AI_RATE_LIMITS } from "@/lib/rate-limit";

interface ReceptionistRequest {
    message: string;
    history: { role: string; content: string }[];
    context?: { propertyTitle?: string; propertyCity?: string };
}

interface ReceptionistResponse {
    message: string;
    filters: {
        city?: string;
        minRent?: number;
        maxRent?: number;
        beds?: number;
        type?: string;
        amenities?: string[];
        category?: string;
        maxPrice?: number;
        condition?: string;
    };
    intent: string;
    shouldShowListings: boolean;
    shouldShowMarketplace?: boolean;
    cartAction?: { action: string; itemType: string; itemId: string } | null;
    captureLeadInfo?: { name?: string; phone?: string; interested_in?: string } | null;
}

export async function POST(request: NextRequest) {
    try {
        const body: ReceptionistRequest = await request.json();
        const { message, history, context } = body;

        // Rate limiting
        const clientIp = request.headers.get("x-forwarded-for") || "unknown";
        const rateLimit = checkRateLimit(clientIp, AI_RATE_LIMITS.receptionist);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "You're sending messages too quickly. Please wait a moment.", intent: "rate_limited", listings: [], filters: {} },
                { status: 429 }
            );
        }

        if (!message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const sanitizedMessage = sanitizeInput(message, 500);
        const prompt = buildReceptionistPrompt(sanitizedMessage, history || [], context);

        const aiResponse = await generateJSON<ReceptionistResponse>(prompt, {
            systemPrompt: RECEPTIONIST_SYSTEM_PROMPT,
            temperature: 0.7,
            maxTokens: 600,
        });

        const supabase = createClient();

        // Fetch matching property listings if AI requests it
        let listings: unknown[] = [];
        if (aiResponse.shouldShowListings && aiResponse.filters) {
            try {
                let query = supabase
                    .from("properties")
                    .select("id, title, city, area, rent, currency, beds, baths, type, agent_id, property_photos(url, is_cover), agent:profiles(name, whatsapp_number)")
                    .eq("status", "published");

                const f = aiResponse.filters;
                if (f.city) query = query.ilike("city", `%${f.city}%`);
                if (f.minRent) query = query.gte("rent", f.minRent);
                if (f.maxRent) query = query.lte("rent", f.maxRent);
                if (f.beds) query = query.gte("beds", f.beds);
                if (f.type) query = query.eq("type", f.type);

                const { data } = await query.limit(4).order("created_at", { ascending: false });
                listings = data || [];
            } catch {
                // Proceed without listings
            }
        }

        // Fetch matching marketplace items if AI requests it
        let marketplaceItems: unknown[] = [];
        if (aiResponse.shouldShowMarketplace && aiResponse.filters) {
            try {
                let query = supabase
                    .from("household_items")
                    .select("id, title, city, area, price, currency, category, condition, seller_id, household_item_photos(url, is_cover), seller:profiles(name, whatsapp_number)")
                    .eq("status", "available");

                const f = aiResponse.filters;
                if (f.city) query = query.ilike("city", `%${f.city}%`);
                if (f.maxPrice) query = query.lte("price", f.maxPrice);
                if (f.category) query = query.eq("category", f.category);
                if (f.condition) query = query.eq("condition", f.condition);

                const { data } = await query.limit(4).order("created_at", { ascending: false });
                marketplaceItems = data || [];
            } catch {
                // Proceed without marketplace items
            }
        }

        return NextResponse.json({
            message: aiResponse.message,
            intent: aiResponse.intent,
            listings,
            marketplaceItems,
            filters: aiResponse.filters,
            cartAction: aiResponse.cartAction || null,
            captureLeadInfo: aiResponse.captureLeadInfo || null,
        });
    } catch (error) {
        console.error("Receptionist API error:", error);
        return NextResponse.json({
            message: "I'm having a moment — could you try again? 😊",
            intent: "error",
            listings: [],
            marketplaceItems: [],
            filters: {},
        });
    }
}
