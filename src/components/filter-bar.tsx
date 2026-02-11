"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useCallback } from "react";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"];
const TYPES = ["apartment", "house", "flat"];

export default function FilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showFilters, setShowFilters] = useState(false);

    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [city, setCity] = useState(searchParams.get("city") || "");
    const [type, setType] = useState(searchParams.get("type") || "");
    const [beds, setBeds] = useState(searchParams.get("beds") || "");

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (city) params.set("city", city);
        if (type) params.set("type", type);
        if (beds) params.set("beds", beds);
        router.push(`/properties?${params.toString()}`);
    }, [search, city, type, beds, router]);

    const clearFilters = () => {
        setSearch("");
        setCity("");
        setType("");
        setBeds("");
        router.push("/properties");
    };

    const hasFilters = search || city || type || beds;

    return (
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Search row */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search properties..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={applyFilters} size="default">
                        Search
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className="shrink-0"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 animate-fade-in">
                        <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All Cities</option>
                            {CITIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All Types</option>
                            {TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={beds}
                            onChange={(e) => setBeds(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">Any Beds</option>
                            {[1, 2, 3, 4, 5].map((b) => (
                                <option key={b} value={b}>
                                    {b}+ Beds
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-2">
                            <Button onClick={applyFilters} className="flex-1" size="sm">
                                Apply
                            </Button>
                            {hasFilters && (
                                <Button onClick={clearFilters} variant="ghost" size="sm">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
