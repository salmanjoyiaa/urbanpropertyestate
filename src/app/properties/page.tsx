import { Suspense } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import FilterBar from "@/components/filter-bar";
import PropertyCard from "@/components/property-card";
import SkeletonCard from "@/components/skeleton-card";
import AISearchSection from "@/components/ai-search-section";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";

interface Props {
    searchParams: { [key: string]: string | string[] | undefined };
}

async function PropertyGrid({ searchParams }: Props) {
    let properties: Property[] = [];
    let totalCount = 0;

    try {
        const supabase = createClient();
        let query = supabase
            .from("properties")
            .select("*, agent:profiles(*), property_photos(*)", { count: "exact" })
            .eq("status", "published");

        // --- Filters ---
        const city = searchParams.city as string;
        const type = searchParams.type as string;
        const beds = searchParams.beds as string;
        const baths = searchParams.baths as string;
        const search = searchParams.search as string;
        const minRent = searchParams.minRent as string;
        const maxRent = searchParams.maxRent as string;
        const currency = searchParams.currency as string;
        const furnished = searchParams.furnished as string;
        const amenities = searchParams.amenities as string;
        const sort = searchParams.sort as string;

        if (city) query = query.eq("city", city);
        if (type) query = query.eq("type", type);
        if (beds) query = query.gte("beds", parseInt(beds));
        if (baths) query = query.gte("baths", parseInt(baths));
        if (search) query = query.or(`title.ilike.%${search}%,area.ilike.%${search}%,city.ilike.%${search}%,description.ilike.%${search}%`);
        if (minRent) query = query.gte("rent", parseInt(minRent));
        if (maxRent) query = query.lte("rent", parseInt(maxRent));
        if (currency) query = query.eq("currency", currency);
        if (furnished === "true") query = query.eq("furnished", true);
        if (furnished === "false") query = query.eq("furnished", false);
        if (amenities) {
            const amenityList = amenities.split(",").filter(Boolean);
            for (const amenity of amenityList) {
                query = query.contains("amenities", [amenity]);
            }
        }

        // --- Sorting ---
        switch (sort) {
            case "price_asc":
                query = query.order("rent", { ascending: true });
                break;
            case "price_desc":
                query = query.order("rent", { ascending: false });
                break;
            case "beds_desc":
                query = query.order("beds", { ascending: false });
                break;
            case "size_desc":
                query = query.order("size_sqft", { ascending: false, nullsFirst: false });
                break;
            default:
                query = query.order("created_at", { ascending: false });
        }

        const { data, count } = await query.limit(48);
        properties = (data as Property[]) || [];
        totalCount = count || 0;
    } catch {
        // Supabase not connected
    }

    if (properties.length === 0) {
        return (
            <>
                <ResultsHeader count={0} searchParams={searchParams} />
                <div className="text-center py-20">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                        <svg className="h-10 w-10 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">No properties found</h3>
                    <p className="text-muted-foreground mb-4">
                        Try adjusting your filters or search in a different city
                    </p>
                    <a
                        href="/properties"
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Clear All Filters
                    </a>
                </div>
            </>
        );
    }

    return (
        <>
            <ResultsHeader count={totalCount} searchParams={searchParams} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>
        </>
    );
}

function ResultsHeader({ count, searchParams }: { count: number; searchParams: Props["searchParams"] }) {
    const hasFilters = Object.keys(searchParams).some((key) => searchParams[key]);
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="font-display text-3xl font-bold">Properties</h1>
                <p className="text-muted-foreground mt-1">
                    {hasFilters
                        ? `${count} ${count === 1 ? "property" : "properties"} match your filters`
                        : "Browse available rental listings"
                    }
                </p>
            </div>
        </div>
    );
}

function LoadingGrid() {
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-3xl font-bold">Properties</h1>
                    <p className="text-muted-foreground mt-1">Loading listings...</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </>
    );
}

export default function PropertiesPage({ searchParams }: Props) {
    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="pt-16">
                <Suspense fallback={null}>
                    <FilterBar />
                </Suspense>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* AI-Powered Search */}
                    <AISearchSection />

                    <Suspense fallback={<LoadingGrid />}>
                        <PropertyGrid searchParams={searchParams} />
                    </Suspense>
                </div>
            </div>

            <Footer />
        </main>
    );
}
