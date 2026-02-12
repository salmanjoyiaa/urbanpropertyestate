import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api-helpers";
import { generateJSON, generateText } from "@/lib/ai/groq";
import {
    SEARCH_SYSTEM_PROMPT,
    getSearchPrompt,
    getSearchExplanationPrompt,
} from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import type { ExtractedFilters, SearchResponse, MatchedProperty } from "@/lib/ai/types";
import type { Property } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimitResponse = applyRateLimit(request, "search");
        if (rateLimitResponse) return rateLimitResponse;

        const { query } = await request.json();

        if (!query?.trim()) {
            return NextResponse.json(
                { error: "Search query is required" },
                { status: 400 }
            );
        }

        // Extract structured filters from natural language
        const filters = await generateJSON<ExtractedFilters>(
            getSearchPrompt(query),
            { systemPrompt: SEARCH_SYSTEM_PROMPT, temperature: 0.2 }
        );

        // Build Supabase query from extracted filters
        const supabase = createClient();
        let dbQuery = supabase
            .from("properties")
            .select("*, agent:profiles(*), property_photos(*)")
            .eq("status", "published");

        if (filters.city) {
            dbQuery = dbQuery.ilike("city", `%${filters.city}%`);
        }
        if (filters.area) {
            dbQuery = dbQuery.ilike("area", `%${filters.area}%`);
        }
        if (filters.type) {
            dbQuery = dbQuery.eq("type", filters.type);
        }
        if (filters.beds) {
            dbQuery = dbQuery.gte("beds", filters.beds);
        }
        if (filters.baths) {
            dbQuery = dbQuery.gte("baths", filters.baths);
        }
        if (filters.minRent) {
            dbQuery = dbQuery.gte("rent", filters.minRent);
        }
        if (filters.maxRent) {
            dbQuery = dbQuery.lte("rent", filters.maxRent);
        }
        if (filters.furnished !== null && filters.furnished !== undefined) {
            dbQuery = dbQuery.eq("furnished", filters.furnished);
        }

        const { data: properties } = await dbQuery
            .order("created_at", { ascending: false })
            .limit(10);

        const results: MatchedProperty[] = (properties || []).map((property: Property) => {
            const reasons: string[] = [];
            let score = 50; // Base score

            if (filters.city && property.city.toLowerCase().includes(filters.city.toLowerCase())) {
                reasons.push(`Located in ${property.city}`);
                score += 15;
            }
            if (filters.area && property.area.toLowerCase().includes(filters.area.toLowerCase())) {
                reasons.push(`In ${property.area} area`);
                score += 10;
            }
            if (filters.beds && property.beds >= filters.beds) {
                reasons.push(`${property.beds} bedroom(s) meet your requirement`);
                score += 10;
            }
            if (filters.maxRent && property.rent <= filters.maxRent) {
                reasons.push(`Within your budget at ${property.currency} ${property.rent.toLocaleString()}`);
                score += 15;
            }
            if (filters.amenities && filters.amenities.length > 0) {
                const matched = filters.amenities.filter((a: string) =>
                    property.amenities.some((pa: string) => pa.toLowerCase().includes(a.toLowerCase()))
                );
                if (matched.length > 0) {
                    reasons.push(`Has ${matched.join(", ")}`);
                    score += matched.length * 5;
                }
            }
            if (property.furnished && filters.furnished) {
                reasons.push("Furnished as requested");
                score += 5;
            }

            return {
                property,
                matchScore: Math.min(score, 100),
                matchReasons: reasons.length > 0 ? reasons : ["Matches your general criteria"],
            };
        });

        // Sort by match score
        results.sort((a, b) => b.matchScore - a.matchScore);
        const topResults = results.slice(0, 5);

        // Generate explanation
        let explanation = "";
        try {
            explanation = await generateText(
                getSearchExplanationPrompt(
                    query,
                    topResults.map((r) => ({
                        title: r.property.title,
                        rent: r.property.rent,
                        currency: r.property.currency,
                        beds: r.property.beds,
                        area: r.property.area,
                        amenities: r.property.amenities,
                    })),
                    filters as unknown as Record<string, unknown>
                ),
                { temperature: 0.6, model: "INSTANT" }
            );
        } catch {
            explanation = `Found ${topResults.length} properties matching your criteria.`;
        }

        const response: SearchResponse = {
            results: topResults,
            explanation,
            extractedFilters: filters,
            originalQuery: query,
        };

        return NextResponse.json(response);
    } catch (error: unknown) {
        console.error("Search error:", error);
        const message = error instanceof Error ? error.message : "Search failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
