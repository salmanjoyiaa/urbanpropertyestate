"use client";

import { useState } from "react";
import { Sparkles, Loader2, Globe, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CopilotResponse, ListingTone } from "@/lib/ai/types";

interface AICopilotPanelProps {
    onApply: (title: string, description: string) => void;
    propertyData?: {
        type?: string;
        beds?: number;
        baths?: number;
        rent?: number;
        currency?: string;
        city?: string;
        area?: string;
        amenities?: string[];
        furnished?: boolean;
    };
}

const TONES: Array<{ value: ListingTone; label: string; emoji: string; desc: string }> = [
    { value: "premium", label: "Premium", emoji: "✨", desc: "Luxury & sophisticated" },
    { value: "family", label: "Family", emoji: "🏡", desc: "Warm & welcoming" },
    { value: "student", label: "Student", emoji: "🎓", desc: "Budget-friendly & practical" },
];

const MARKETS = [
    { value: "gcc", label: "GCC", languages: "EN/AR", flag: "🇦🇪" },
    { value: "eu", label: "EU", languages: "EN/ES/IT/FR", flag: "🇪🇺" },
];

const LANG_INFO: Record<string, { name: string; flag: string }> = {
    ar: { name: "Arabic", flag: "🇦🇪" },
    es: { name: "Spanish", flag: "🇪🇸" },
    it: { name: "Italian", flag: "🇮🇹" },
    fr: { name: "French", flag: "🇫🇷" },
};

export default function AICopilotPanel({ onApply, propertyData }: AICopilotPanelProps) {
    const [bulletPoints, setBulletPoints] = useState("");
    const [tone, setTone] = useState<ListingTone>("premium");
    const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CopilotResponse | null>(null);
    const [error, setError] = useState("");
    const [showTranslations, setShowTranslations] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const toggleMarket = (market: string) => {
        setSelectedMarkets((prev) =>
            prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market]
        );
    };

    const handleGenerate = async () => {
        if (!bulletPoints.trim()) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch("/api/ai/copilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bulletPoints,
                    tone,
                    languages: selectedMarkets.length > 0 ? selectedMarkets : ["en"],
                    propertyData,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.violations) {
                    setError(`Compliance issue: ${data.violations.map((v: { suggestion: string }) => v.suggestion).join(". ")}`);
                    if (data.generated) setResult(data.generated);
                } else {
                    setError(data.error || "Generation failed");
                }
                return;
            }

            setResult(data);
        } catch {
            setError("Failed to connect to AI service");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    AI Listing Copilot
                    <Badge variant="outline" className="text-xs font-normal ml-auto">
                        Powered by AI
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Bullet Points Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                        Key Features (bullet points)
                    </label>
                    <textarea
                        value={bulletPoints}
                        onChange={(e) => setBulletPoints(e.target.value)}
                        placeholder="2BR, modern kitchen, gym, parking, AED 120k/year, near metro"
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                </div>

                {/* Tone Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Tone</label>
                    <div className="grid grid-cols-3 gap-2">
                        {TONES.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setTone(t.value)}
                                className={`p-2 rounded-lg border text-center transition-all duration-200 ${tone === t.value
                                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                        : "border-input hover:border-primary/50"
                                    }`}
                            >
                                <span className="text-lg">{t.emoji}</span>
                                <div className="text-xs font-medium mt-1">{t.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Market Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        Target Markets
                    </label>
                    <div className="flex gap-2">
                        {MARKETS.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                onClick={() => toggleMarket(m.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${selectedMarkets.includes(m.value)
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-input text-muted-foreground hover:border-primary/50"
                                    }`}
                            >
                                <span>{m.flag}</span>
                                {m.label}
                                <span className="opacity-60">({m.languages})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading || !bulletPoints.trim()}
                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Listing
                        </>
                    )}
                </Button>

                {/* Error */}
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-3 pt-2 border-t">
                        {/* Generated Title */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Generated Title
                                </label>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(result.title, "title")}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {copiedField === "title" ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-sm font-medium p-2 rounded bg-muted/50">
                                {result.title}
                            </p>
                        </div>

                        {/* Generated Description */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Generated Description
                                </label>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(result.description, "desc")}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {copiedField === "desc" ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground p-2 rounded bg-muted/50 whitespace-pre-wrap leading-relaxed">
                                {result.description}
                            </p>
                        </div>

                        {/* Apply Button */}
                        <Button
                            type="button"
                            onClick={() => onApply(result.title, result.description)}
                            className="w-full"
                            variant="outline"
                        >
                            Apply to Listing
                        </Button>

                        {/* Translations */}
                        {Object.keys(result.translations || {}).length > 0 && (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTranslations(!showTranslations)}
                                    className="flex items-center gap-2 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Globe className="h-4 w-4" />
                                    Translations ({Object.keys(result.translations).length} languages)
                                    {showTranslations ? (
                                        <ChevronUp className="h-4 w-4 ml-auto" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 ml-auto" />
                                    )}
                                </button>

                                {showTranslations && (
                                    <div className="space-y-3">
                                        {Object.entries(result.translations).map(([lang, translation]) => (
                                            <div
                                                key={lang}
                                                className="p-3 rounded-lg border bg-muted/30 space-y-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">
                                                        {LANG_INFO[lang]?.flag || "🌐"}
                                                    </span>
                                                    <span className="text-xs font-medium">
                                                        {LANG_INFO[lang]?.name || lang.toUpperCase()}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                `${translation.title}\n\n${translation.description}`,
                                                                `trans-${lang}`
                                                            )
                                                        }
                                                        className="ml-auto text-muted-foreground hover:text-foreground"
                                                    >
                                                        {copiedField === `trans-${lang}` ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-sm font-medium" dir={lang === "ar" ? "rtl" : "ltr"}>
                                                    {translation.title}
                                                </p>
                                                <p
                                                    className="text-xs text-muted-foreground leading-relaxed"
                                                    dir={lang === "ar" ? "rtl" : "ltr"}
                                                >
                                                    {translation.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
