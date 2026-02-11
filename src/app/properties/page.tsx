import { Suspense } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import FilterBar from "@/components/filter-bar";
import PropertyCard from "@/components/property-card";
import SkeletonCard from "@/components/skeleton-card";
import { createClient } from "@/lib/supabase/server";
import type { Property, PropertyFilters } from "@/lib/types";

interface Props {
    searchParams: { [key: string]: string | string[] | undefined };
}

async function PropertyGrid({ searchParams }: Props) {
    let properties: Property[] = [];

    try {
        const supabase = createClient();
        let query = supabase
            .from("properties")
            .select("*, agent:profiles(*), property_photos(*)")
            .eq("status", "published")
            .order("created_at", { ascending: false });

        const city = searchParams.city as string;
        const type = searchParams.type as string;
        const beds = searchParams.beds as string;
        const search = searchParams.search as string;

        if (city) query = query.eq("city", city);
        if (type) query = query.eq("type", type);
        if (beds) query = query.gte("beds", parseInt(beds));
        if (search) query = query.ilike("title", `%${search}%`);

        const { data } = await query.limit(24);
        properties = (data as Property[]) || [];
    } catch {
        // Supabase not connected
    }

    if (properties.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <svg className="h-10 w-10 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">No properties found</h3>
                <p className="text-muted-foreground">
                    Try adjusting your filters or check back later
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
            ))}
        </div>
    );
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
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
                    <div className="mb-6">
                        <h1 className="font-display text-3xl font-bold">Properties</h1>
                        <p className="text-muted-foreground mt-1">
                            Browse available rental listings
                        </p>
                    </div>

                    <Suspense fallback={<LoadingGrid />}>
                        <PropertyGrid searchParams={searchParams} />
                    </Suspense>
                </div>
            </div>

            <Footer />
        </main>
    );
}
