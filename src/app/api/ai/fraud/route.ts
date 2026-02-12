import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/groq";
import { getFraudPrompt } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import type { FraudAnalysis } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
    try {
        const { propertyId } = await request.json();

        if (!propertyId) {
            return NextResponse.json(
                { error: "Property ID is required" },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Fetch the property
        const { data: property, error: propError } = await supabase
            .from("properties")
            .select("*, property_photos(*)")
            .eq("id", propertyId)
            .single();

        if (propError || !property) {
            return NextResponse.json(
                { error: "Property not found" },
                { status: 404 }
            );
        }

        // Get area average price
        const { data: areaProps } = await supabase
            .from("properties")
            .select("rent")
            .eq("city", property.city)
            .eq("status", "published")
            .neq("id", propertyId);

        const areaAvgPrice = areaProps && areaProps.length > 0
            ? Math.round(areaProps.reduce((sum: number, p: { rent: number }) => sum + p.rent, 0) / areaProps.length)
            : undefined;

        // Rule-based pre-checks
        const ruleFlags: FraudAnalysis["flags"] = [];

        // Pricing check
        if (areaAvgPrice && property.rent < areaAvgPrice * 0.6) {
            ruleFlags.push({
                type: "pricing",
                severity: "high",
                description: `Rent (${property.currency} ${property.rent}) is ${Math.round((1 - property.rent / areaAvgPrice) * 100)}% below area average (${property.currency} ${areaAvgPrice})`,
            });
        }

        // No photos check
        if (!property.property_photos || property.property_photos.length === 0) {
            ruleFlags.push({
                type: "photos",
                severity: "medium",
                description: "No photos uploaded. Listings without photos may indicate fraud.",
            });
        }

        // Short description check
        if (property.description && property.description.length < 50) {
            ruleFlags.push({
                type: "description",
                severity: "low",
                description: "Very short description may indicate low-effort or fraudulent listing.",
            });
        }

        // AI-powered analysis for deeper fraud detection
        let aiAnalysis: FraudAnalysis = {
            riskScore: 0,
            flags: [],
            recommendation: "approve",
        };

        try {
            aiAnalysis = await generateJSON<FraudAnalysis>(
                getFraudPrompt(
                    {
                        title: property.title,
                        description: property.description,
                        rent: property.rent,
                        currency: property.currency,
                        city: property.city,
                        area: property.area,
                        beds: property.beds,
                        amenities: property.amenities,
                        photoCount: property.property_photos?.length || 0,
                    },
                    areaAvgPrice
                ),
                { temperature: 0.2, model: "FAST" }
            );
        } catch {
            // If AI fails, rely on rule-based checks
        }

        // Merge rule-based and AI flags
        const allFlags = [...ruleFlags, ...(aiAnalysis.flags || [])];

        // Calculate combined risk score
        const ruleScore = ruleFlags.reduce((s, f) => {
            return s + (f.severity === "high" ? 30 : f.severity === "medium" ? 15 : 5);
        }, 0);

        const combinedScore = Math.min(
            Math.max(ruleScore, aiAnalysis.riskScore || 0),
            100
        );

        let recommendation: FraudAnalysis["recommendation"];
        if (combinedScore >= 70) recommendation = "reject";
        else if (combinedScore >= 40) recommendation = "review";
        else recommendation = "approve";

        const result: FraudAnalysis = {
            riskScore: combinedScore,
            flags: allFlags,
            recommendation,
        };

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("Fraud detection error:", error);
        const message = error instanceof Error ? error.message : "Fraud analysis failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
