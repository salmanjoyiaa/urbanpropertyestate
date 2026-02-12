"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useState, useCallback, useMemo, useEffect } from "react";

// All cities available across our multi-market portfolio
const CITIES = [
    // Pakistan
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
    // US
    "New York", "Miami",
    // UK
    "London",
    // Europe
    "Barcelona", "Rome",
    // Middle East
    "Dubai", "Riyadh",
];

const TYPES = ["apartment", "house", "flat"];

const AMENITIES = [
    "Pool", "Gym", "Parking", "AC", "Elevator", "Concierge",
    "Rooftop", "Balcony", "Garden", "Beach Access", "Smart Home",
    "Laundry", "Washer/Dryer", "Doorman", "Bike Storage",
    "Maid Room", "Security", "Kids Play Area",
];

const CURRENCIES = [
    { value: "", label: "Any Currency" },
    { value: "USD", label: "USD ($)" },
    { value: "PKR", label: "PKR (₨)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "AED", label: "AED (د.إ)" },
    { value: "SAR", label: "SAR (﷼)" },
];

const SORT_OPTIONS = [
    { value: "", label: "Newest First" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "beds_desc", label: "Most Bedrooms" },
    { value: "size_desc", label: "Largest First" },
];

interface FilterBarProps {
    totalResults?: number;
}

export default function FilterBar({ totalResults }: FilterBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [showFilters, setShowFilters] = useState(false);

    // Basic filters
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [city, setCity] = useState(searchParams.get("city") || "");
    const [type, setType] = useState(searchParams.get("type") || "");
    const [beds, setBeds] = useState(searchParams.get("beds") || "");
    const [baths, setBaths] = useState(searchParams.get("baths") || "");

    // Advanced filters
    const [minRent, setMinRent] = useState(searchParams.get("minRent") || "");
    const [maxRent, setMaxRent] = useState(searchParams.get("maxRent") || "");
    const [currency, setCurrency] = useState(searchParams.get("currency") || "");
    const [furnished, setFurnished] = useState(searchParams.get("furnished") || "");
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
        searchParams.get("amenities")?.split(",").filter(Boolean) || []
    );
    const [sort, setSort] = useState(searchParams.get("sort") || "");

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (city) params.set("city", city);
        if (type) params.set("type", type);
        if (beds) params.set("beds", beds);
        if (baths) params.set("baths", baths);
        if (minRent) params.set("minRent", minRent);
        if (maxRent) params.set("maxRent", maxRent);
        if (currency) params.set("currency", currency);
        if (furnished) params.set("furnished", furnished);
        if (selectedAmenities.length > 0) params.set("amenities", selectedAmenities.join(","));
        if (sort) params.set("sort", sort);
        router.push(`/properties?${params.toString()}`);
    }, [search, city, type, beds, baths, minRent, maxRent, currency, furnished, selectedAmenities, sort, router]);

    const clearFilters = () => {
        setSearch("");
        setCity("");
        setType("");
        setBeds("");
        setBaths("");
        setMinRent("");
        setMaxRent("");
        setCurrency("");
        setFurnished("");
        setSelectedAmenities([]);
        setSort("");
        router.push("/properties");
    };

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
        );
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (city) count++;
        if (type) count++;
        if (beds) count++;
        if (baths) count++;
        if (minRent || maxRent) count++;
        if (currency) count++;
        if (furnished) count++;
        if (selectedAmenities.length > 0) count++;
        return count;
    }, [city, type, beds, baths, minRent, maxRent, currency, furnished, selectedAmenities]);

    const hasFilters = search || activeFilterCount > 0;
    const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

    // Track a "badge removed" counter to auto-apply when a badge is dismissed
    const [badgeRemoved, setBadgeRemoved] = useState(0);
    useEffect(() => {
        if (badgeRemoved > 0) applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [badgeRemoved]);

    const removeBadge = (setter: (v: string) => void, value?: string) => {
        if (value !== undefined) setter(value);
        else setter("");
        setBadgeRemoved((n) => n + 1);
    };

    return (
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                {/* Top row: Search + Sort + Filter toggle */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, area, or city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                            className="pl-10"
                        />
                    </div>

                    {/* Sort dropdown */}
                    <select
                        value={sort}
                        onChange={(e) => {
                            setSort(e.target.value);
                            // Auto-apply sort
                            const params = new URLSearchParams(searchParams.toString());
                            if (e.target.value) {
                                params.set("sort", e.target.value);
                            } else {
                                params.delete("sort");
                            }
                            router.push(`/properties?${params.toString()}`);
                        }}
                        className={`${selectClass} w-[160px] shrink-0 hidden sm:flex`}
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <Button onClick={applyFilters} size="default">
                        Search
                    </Button>

                    <Button
                        variant={activeFilterCount > 0 ? "default" : "outline"}
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className="shrink-0 relative"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Results count + active filter badges */}
                {(totalResults !== undefined || hasFilters) && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {totalResults !== undefined && (
                            <span className="text-sm text-muted-foreground font-medium">
                                {totalResults} {totalResults === 1 ? "property" : "properties"} found
                            </span>
                        )}

                        {hasFilters && (
                            <>
                                <span className="text-muted-foreground/30">|</span>
                                {city && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                        {city}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeBadge(setCity)} />
                                    </Badge>
                                )}
                                {type && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                        {type}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeBadge(setType)} />
                                    </Badge>
                                )}
                                {(minRent || maxRent) && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                        {minRent || "0"} – {maxRent || "∞"}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinRent(""); removeBadge(setMaxRent); }} />
                                    </Badge>
                                )}
                                {beds && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                        {beds}+ beds
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeBadge(setBeds)} />
                                    </Badge>
                                )}
                                {selectedAmenities.length > 0 && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                        {selectedAmenities.length} amenities
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => { setSelectedAmenities([]); setBadgeRemoved((n) => n + 1); }} />
                                    </Badge>
                                )}
                                <Button onClick={clearFilters} variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground">
                                    Clear all
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {/* Expanded filter panel */}
                {showFilters && (
                    <div className="mt-3 pt-3 border-t space-y-4 animate-fade-in">
                        {/* Row 1: Location + Type */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                                <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
                                    <option value="">All Cities</option>
                                    <optgroup label="Pakistan">
                                        {CITIES.slice(0, 5).map((c) => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                    <optgroup label="United States">
                                        {CITIES.slice(5, 7).map((c) => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                    <optgroup label="United Kingdom">
                                        {CITIES.slice(7, 8).map((c) => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                    <optgroup label="Europe">
                                        {CITIES.slice(8, 10).map((c) => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                    <optgroup label="Middle East">
                                        {CITIES.slice(10).map((c) => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                                <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
                                    <option value="">All Types</option>
                                    {TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Bedrooms</label>
                                <select value={beds} onChange={(e) => setBeds(e.target.value)} className={selectClass}>
                                    <option value="">Any</option>
                                    {[1, 2, 3, 4, 5].map((b) => (
                                        <option key={b} value={b}>{b}+ Beds</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Bathrooms</label>
                                <select value={baths} onChange={(e) => setBaths(e.target.value)} className={selectClass}>
                                    <option value="">Any</option>
                                    {[1, 2, 3, 4].map((b) => (
                                        <option key={b} value={b}>{b}+ Baths</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Price range + Currency + Furnished */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Price</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={minRent}
                                    onChange={(e) => setMinRent(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Price</label>
                                <Input
                                    type="number"
                                    placeholder="No limit"
                                    value={maxRent}
                                    onChange={(e) => setMaxRent(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
                                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectClass}>
                                    {CURRENCIES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Furnished</label>
                                <select value={furnished} onChange={(e) => setFurnished(e.target.value)} className={selectClass}>
                                    <option value="">Any</option>
                                    <option value="true">Furnished</option>
                                    <option value="false">Unfurnished</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 3: Amenities */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">Amenities</label>
                            <div className="flex flex-wrap gap-2">
                                {AMENITIES.map((amenity) => (
                                    <button
                                        key={amenity}
                                        onClick={() => toggleAmenity(amenity)}
                                        aria-pressed={selectedAmenities.includes(amenity)}
                                        aria-label={`Filter by ${amenity}`}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedAmenities.includes(amenity)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background text-muted-foreground hover:bg-muted border-input"
                                            }`}
                                    >
                                        {amenity}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort (mobile) + Actions */}
                        <div className="flex items-center gap-3">
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className={`${selectClass} sm:hidden`}
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <div className="flex gap-2 ml-auto">
                                <Button onClick={applyFilters} size="sm">
                                    Apply Filters
                                </Button>
                                {hasFilters && (
                                    <Button onClick={clearFilters} variant="ghost" size="sm">
                                        <X className="h-4 w-4 mr-1" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
