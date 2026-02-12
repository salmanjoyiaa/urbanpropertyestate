import { NextRequest, NextResponse } from "next/server";
import { getPricingRecommendation } from "@/lib/ai/pricing-engine";

export async function POST(request: NextRequest) {
    try {
        const { city, area, beds, type, currentPrice, currency, amenities, furnished } = await request.json();

        if (!city || !beds || !currentPrice) {
            return NextResponse.json(
                { error: "City, beds, and current price are required" },
                { status: 400 }
            );
        }

        const recommendation = await getPricingRecommendation(
            city,
            area || "",
            beds,
            type || "apartment",
            currentPrice,
            currency || "USD",
            amenities || [],
            furnished || false
        );

        return NextResponse.json(recommendation);
    } catch (error: unknown) {
        console.error("Pricing error:", error);
        const message = error instanceof Error ? error.message : "Pricing analysis failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
