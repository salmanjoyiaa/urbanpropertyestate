"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Loader2, BarChart3, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PricingRecommendation } from "@/lib/ai/types";

interface PricingInsightProps {
    city: string;
    area: string;
    beds: number;
    type: string;
    currentPrice: number;
    currency: string;
    amenities: string[];
    furnished: boolean;
}

export default function PricingInsight({
    city,
    area,
    beds,
    type,
    currentPrice,
    currency,
    amenities,
    furnished,
}: PricingInsightProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PricingRecommendation | null>(null);
    const [error, setError] = useState("");

    const fetchPricing = async () => {
        if (!city || !beds || !currentPrice) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/ai/pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ city, area, beds, type, currentPrice, currency, amenities, furnished }),
            });

            const result = await res.json();
            if (!res.ok) {
                setError(result.error || "Failed to get pricing data");
                return;
            }

            setData(result);
        } catch {
            setError("Failed to connect to pricing service");
        } finally {
            setLoading(false);
        }
    };

    if (!data && !loading) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={fetchPricing}
                className="gap-2"
                disabled={!city || !beds || !currentPrice}
            >
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                Get Price Insight
            </Button>
        );
    }

    const positionConfig = {
        below: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-50", label: "Below Market" },
        competitive: { icon: Minus, color: "text-emerald-500", bg: "bg-emerald-50", label: "Competitive" },
        above: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50", label: "Above Average" },
        premium: { icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50", label: "Premium" },
    };

    return (
        <Card className="border-blue-200/50">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                        Price Insight
                    </span>
                    {data && (
                        <Badge variant="outline" className="text-xs">
                            {data.comparableCount} comparables
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing market data...
                    </div>
                )}

                {error && (
                    <p className="text-xs text-destructive">{error}</p>
                )}

                {data && (
                    <>
                        {/* Price Position */}
                        {(() => {
                            const config = positionConfig[data.pricePosition];
                            const Icon = config.icon;
                            return (
                                <div className={`flex items-center gap-2 p-2 rounded-lg ${config.bg}`}>
                                    <Icon className={`h-4 w-4 ${config.color}`} />
                                    <span className={`text-sm font-medium ${config.color}`}>
                                        {config.label}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Price Range Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{currency} {data.suggestedRange.low.toLocaleString()}</span>
                                <span>{currency} {data.suggestedRange.high.toLocaleString()}</span>
                            </div>
                            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 rounded-full"
                                    style={{
                                        left: "10%",
                                        width: "80%",
                                    }}
                                />
                                {/* Your price marker */}
                                <div
                                    className="absolute top-0 h-full w-0.5 bg-primary"
                                    style={{
                                        left: `${Math.min(
                                            Math.max(
                                                ((currentPrice - data.suggestedRange.low) /
                                                    (data.suggestedRange.high - data.suggestedRange.low)) * 80 + 10,
                                                5
                                            ),
                                            95
                                        )}%`,
                                    }}
                                    title={`Your price: ${currency} ${currentPrice.toLocaleString()}`}
                                />
                            </div>
                            <div className="text-center">
                                <span className="text-xs text-muted-foreground">
                                    Suggested: <span className="font-medium text-foreground">{currency} {data.suggestedRange.median.toLocaleString()}</span>
                                </span>
                            </div>
                        </div>

                        {/* Insights */}
                        <div className="space-y-1.5">
                            {data.insights.map((insight, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-400" />
                                    {insight}
                                </div>
                            ))}
                        </div>

                        {/* Confidence */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Confidence:</span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3].map((level) => (
                                    <div
                                        key={level}
                                        className={`w-4 h-1.5 rounded-full ${(data.confidence === "high" || (data.confidence === "medium" && level <= 2) || (data.confidence === "low" && level <= 1))
                                                ? "bg-primary"
                                                : "bg-muted"
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground capitalize">{data.confidence}</span>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
