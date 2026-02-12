"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ListingSummary, TruthLabel, SummaryField } from "@/lib/ai/types";

interface ListingSummaryCardProps {
    description: string;
    price?: number;
    currency?: string;
    autoLoad?: boolean;
}

const TRUTH_ICONS: Record<TruthLabel, { icon: typeof CheckCircle; color: string; label: string }> = {
    confirmed: { icon: CheckCircle, color: "text-emerald-500", label: "Confirmed" },
    unclear: { icon: HelpCircle, color: "text-amber-500", label: "Unclear" },
    missing: { icon: XCircle, color: "text-red-500", label: "Missing" },
};

export default function ListingSummaryCard({
    description,
    price,
    currency,
    autoLoad = false,
}: ListingSummaryCardProps) {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<ListingSummary | null>(null);
    const [error, setError] = useState("");

    const handleSummarize = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/ai/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, price, currency }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Summarization failed");
                return;
            }

            setSummary(data);
        } catch {
            setError("Failed to analyze listing");
        } finally {
            setLoading(false);
        }
    };

    if (!summary && !loading) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleSummarize}
                className="gap-2"
            >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI Summary
            </Button>
        );
    }

    return (
        <Card className="border-primary/20">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Listing Analysis
                    </span>
                    {summary && (
                        <Badge
                            className={`text-xs ${summary.overallScore >= 7
                                    ? "bg-emerald-100 text-emerald-800"
                                    : summary.overallScore >= 4
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                        >
                            Transparency: {summary.overallScore}/10
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading && (
                    <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing listing details...
                    </div>
                )}

                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {summary && (
                    <>
                        {/* Key Facts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {summary.fields.map((field: SummaryField, i: number) => {
                                const truthInfo = TRUTH_ICONS[field.truthLabel] || TRUTH_ICONS.missing;
                                const Icon = truthInfo.icon;
                                return (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30"
                                    >
                                        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${truthInfo.color}`} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {field.label}
                                            </p>
                                            <p className="text-sm font-medium truncate">{field.value}</p>
                                            {field.note && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {field.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Move-in Costs */}
                        {summary.moveInCosts && (
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                                <p className="text-xs font-medium text-blue-800 mb-1">
                                    💰 Estimated Move-in Costs
                                </p>
                                <p className="text-sm text-blue-700">{summary.moveInCosts}</p>
                            </div>
                        )}

                        {/* Red Flags */}
                        {summary.redFlags.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                    Points to Clarify
                                </p>
                                {summary.redFlags.map((flag: string, i: number) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-800"
                                    >
                                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                        {flag}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
