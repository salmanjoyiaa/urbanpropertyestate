"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Loader2, X, MessageCircle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PropertyCard from "@/components/property-card";
import type { SearchResponse, ExtractedFilters } from "@/lib/ai/types";

interface ConversationalSearchProps {
    onFiltersExtracted?: (filters: ExtractedFilters) => void;
}

const EXAMPLE_QUERIES = [
    "2-bedroom flat in DHA, max 60,000 PKR, with parking",
    "Furnished apartment near metro, gym access, move in next month",
    "Family house with garden in Gulberg, under 150k PKR",
    "Studio flat in Clifton with sea view, budget 30-40k",
];

export default function ConversationalSearch({ onFiltersExtracted }: ConversationalSearchProps) {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SearchResponse | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (searchQuery?: string) => {
        const q = searchQuery || query;
        if (!q.trim()) return;

        setLoading(true);
        setError("");
        setIsOpen(true);

        try {
            const res = await fetch("/api/ai/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: q }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Search failed");
                return;
            }

            setResult(data);
            if (data.extractedFilters && onFiltersExtracted) {
                onFiltersExtracted(data.extractedFilters);
            }
        } catch {
            setError("Failed to connect to AI search");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    };

    const clearSearch = () => {
        setQuery("");
        setResult(null);
        setIsOpen(false);
        setError("");
    };

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
                <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => !result && setIsOpen(true)}
                        placeholder="Describe what you're looking for... (e.g., '2BR near metro, max 50k PKR')"
                        className="flex h-12 w-full rounded-xl border-2 border-primary/20 bg-background pl-10 pr-24 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        {query && (
                            <button
                                onClick={clearSearch}
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <Button
                            size="sm"
                            onClick={() => handleSearch()}
                            disabled={loading || !query.trim()}
                            className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Example Queries */}
                {isOpen && !result && !loading && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl border bg-background shadow-xl z-50">
                        <p className="text-xs font-medium text-muted-foreground mb-3">
                            Try asking in natural language:
                        </p>
                        <div className="space-y-2">
                            {EXAMPLE_QUERIES.map((example) => (
                                <button
                                    key={example}
                                    onClick={() => {
                                        setQuery(example);
                                        handleSearch(example);
                                    }}
                                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted text-sm text-left transition-colors"
                                >
                                    <MessageCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    <span className="text-muted-foreground">{example}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center gap-3 p-6 rounded-xl border bg-muted/30">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div>
                        <p className="text-sm font-medium">Searching properties...</p>
                        <p className="text-xs text-muted-foreground">AI is analyzing your query and finding the best matches</p>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && !loading && (
                <div className="space-y-4">
                    {/* Extracted Filters */}
                    {result.extractedFilters && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Understood:</span>
                            {result.extractedFilters.city && (
                                <Badge variant="secondary" className="text-xs">{result.extractedFilters.city}</Badge>
                            )}
                            {result.extractedFilters.area && (
                                <Badge variant="secondary" className="text-xs">{result.extractedFilters.area}</Badge>
                            )}
                            {result.extractedFilters.beds && (
                                <Badge variant="secondary" className="text-xs">{result.extractedFilters.beds} bed(s)</Badge>
                            )}
                            {result.extractedFilters.maxRent && (
                                <Badge variant="secondary" className="text-xs">Max {result.extractedFilters.currency || "PKR"} {result.extractedFilters.maxRent?.toLocaleString()}</Badge>
                            )}
                            {result.extractedFilters.type && (
                                <Badge variant="secondary" className="text-xs">{result.extractedFilters.type}</Badge>
                            )}
                            {result.extractedFilters.furnished !== null && result.extractedFilters.furnished !== undefined && (
                                <Badge variant="secondary" className="text-xs">{result.extractedFilters.furnished ? "Furnished" : "Unfurnished"}</Badge>
                            )}
                            {(result.extractedFilters.amenities || []).map((a) => (
                                <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                            ))}
                        </div>
                    )}

                    {/* AI Explanation */}
                    {result.explanation && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {result.explanation}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Property Results */}
                    {result.results.length > 0 ? (
                        <div className="space-y-4">
                            <p className="text-sm font-medium">
                                {result.results.length} matching {result.results.length === 1 ? "property" : "properties"}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {result.results.map((match) => (
                                    <div key={match.property.id} className="relative">
                                        <PropertyCard property={match.property} />
                                        {/* Match score badge */}
                                        <div className="absolute top-3 left-3 z-10">
                                            <Badge className={`text-xs font-bold shadow-lg ${match.matchScore >= 80
                                                    ? "bg-emerald-500 text-white"
                                                    : match.matchScore >= 60
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-amber-500 text-white"
                                                }`}>
                                                {match.matchScore}% match
                                            </Badge>
                                        </div>
                                        {/* Match reasons */}
                                        {match.matchReasons.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {match.matchReasons.slice(0, 3).map((reason, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                                                    >
                                                        ✓ {reason}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No properties match your criteria. Try adjusting your search.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
