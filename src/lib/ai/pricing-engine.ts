import { createClient } from "@/lib/supabase/server";
import type { PricingRecommendation, PricingBand } from "./types";

/**
 * Rule-based pricing engine (v1 — no ML)
 * Calculates rent bands from comparable properties in the same area
 */
export async function getPricingRecommendation(
    city: string,
    area: string,
    beds: number,
    type: string,
    currentPrice: number,
    currency: string,
    amenities: string[] = [],
    furnished: boolean = false
): Promise<PricingRecommendation> {
    const supabase = createClient();

    // Find comparable properties
    const { data: comparables } = await supabase
        .from("properties")
        .select("rent, amenities, furnished, beds, type")
        .eq("city", city)
        .eq("status", "published")
        .gte("beds", Math.max(1, beds - 1))
        .lte("beds", beds + 1);

    // Also try broader area match
    const { data: areaComparables } = await supabase
        .from("properties")
        .select("rent, amenities, furnished, beds, type")
        .eq("city", city)
        .eq("area", area)
        .eq("status", "published");

    // Prefer area-specific data, fall back to city-wide
    const props = (areaComparables?.length ?? 0) >= 3
        ? areaComparables!
        : comparables ?? [];

    if (props.length === 0) {
        return {
            suggestedRange: { low: currentPrice * 0.85, median: currentPrice, high: currentPrice * 1.15, currency },
            currentPrice,
            pricePosition: "competitive",
            comparableCount: 0,
            seasonalAdjustment: 0,
            confidence: "low",
            insights: ["Not enough comparable properties in this area to provide accurate pricing data."],
        };
    }

    // Calculate price bands
    const rents = props.map((p) => p.rent).sort((a, b) => a - b);
    const low = percentile(rents, 25);
    const median = percentile(rents, 50);
    const high = percentile(rents, 75);

    // Amenity adjustment
    const premiumAmenities = ["Pool", "Gym", "Elevator", "CCTV", "Generator", "Garden"];
    const amenityBonus = amenities.filter((a) => premiumAmenities.includes(a)).length;
    const amenityAdjustment = amenityBonus * 0.02; // 2% per premium amenity

    // Furnished adjustment
    const furnishedAdjustment = furnished ? 0.10 : 0; // 10% premium for furnished

    // Seasonal adjustment (simplified)
    const month = new Date().getMonth();
    const seasonalFactors: Record<number, number> = {
        0: -0.02, 1: -0.01, 2: 0.02, 3: 0.03, // Jan-Apr: off-peak to warming
        4: 0.05, 5: 0.07, 6: 0.05, 7: 0.03,    // May-Aug: peak season
        8: 0.02, 9: 0.01, 10: -0.01, 11: -0.03, // Sep-Dec: cooling
    };
    const seasonalAdj = seasonalFactors[month] || 0;

    const totalAdjustment = 1 + amenityAdjustment + furnishedAdjustment + seasonalAdj;

    const suggestedRange: PricingBand = {
        low: Math.round(low * totalAdjustment),
        median: Math.round(median * totalAdjustment),
        high: Math.round(high * totalAdjustment),
        currency,
    };

    // Determine price position
    let pricePosition: PricingRecommendation["pricePosition"];
    if (currentPrice < suggestedRange.low * 0.9) pricePosition = "below";
    else if (currentPrice > suggestedRange.high * 1.1) pricePosition = "premium";
    else if (currentPrice > suggestedRange.median) pricePosition = "above";
    else pricePosition = "competitive";

    // Generate insights
    const insights: string[] = [];
    if (pricePosition === "below") {
        insights.push(`Your price is significantly below the area average. Consider increasing to ${currency} ${suggestedRange.median.toLocaleString()} for better returns.`);
    } else if (pricePosition === "premium") {
        insights.push(`Your price is above the premium range. This may limit interest. Consider ${currency} ${suggestedRange.high.toLocaleString()} for faster occupancy.`);
    } else {
        insights.push(`Your price is competitive for the ${area} area.`);
    }

    if (furnished) {
        insights.push("Furnished premium of ~10% is factored into the range.");
    }
    if (amenityBonus >= 3) {
        insights.push(`${amenityBonus} premium amenities justify a higher price point.`);
    }
    if (Math.abs(seasonalAdj) > 0.02) {
        insights.push(seasonalAdj > 0
            ? "Current season supports higher rents."
            : "Off-season may require price flexibility.");
    }

    return {
        suggestedRange,
        currentPrice,
        pricePosition,
        comparableCount: props.length,
        seasonalAdjustment: Math.round(seasonalAdj * 100),
        confidence: props.length >= 10 ? "high" : props.length >= 5 ? "medium" : "low",
        insights,
    };
}

function percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}
