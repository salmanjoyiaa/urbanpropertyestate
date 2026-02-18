import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HouseholdItemCard from "@/components/household-item-card";
import SkeletonCard from "@/components/skeleton-card";
import { createAdminClient } from "@/lib/supabase/admin";
import type { HouseholdItem } from "@/lib/types";
import { Search, SlidersHorizontal, ShoppingBag, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Marketplace — Household Items",
    description:
        "Buy and sell pre-owned household items — furniture, electronics, appliances and more from verified sellers across multiple cities.",
};

const CATEGORIES = [
    { value: "", label: "All Categories", emoji: "🏠" },
    { value: "furniture", label: "Furniture", emoji: "🛋️" },
    { value: "electronics", label: "Electronics", emoji: "📺" },
    { value: "appliances", label: "Appliances", emoji: "🔌" },
    { value: "kitchen", label: "Kitchen", emoji: "🍳" },
    { value: "bedroom", label: "Bedroom", emoji: "🛏️" },
    { value: "bathroom", label: "Bathroom", emoji: "🚿" },
    { value: "decor", label: "Decor", emoji: "🖼️" },
    { value: "lighting", label: "Lighting", emoji: "💡" },
    { value: "storage", label: "Storage", emoji: "📦" },
    { value: "outdoor", label: "Outdoor", emoji: "☀️" },
    { value: "kids", label: "Kids", emoji: "🧸" },
    { value: "other", label: "Other", emoji: "📎" },
];

const CITIES = [
    "Karachi", "Lahore", "New York", "Miami", "London",
    "Barcelona", "Rome", "Dubai", "Riyadh",
];

const CONDITIONS = [
    { value: "", label: "Any Condition" },
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "used", label: "Used" },
];

interface Props {
    searchParams: { [key: string]: string | string[] | undefined };
}

async function ItemGrid({ searchParams }: Props) {
    let items: HouseholdItem[] = [];
    let totalCount = 0;

    try {
        const supabase = createAdminClient();
        let query = supabase
            .from("household_items")
            .select("*, seller:profiles!seller_id(*), household_item_photos(*)", { count: "exact" })
            .eq("status", "available");

        const category = searchParams.category as string;
        const city = searchParams.city as string;
        const condition = searchParams.condition as string;
        const search = searchParams.search as string;
        const maxPrice = searchParams.maxPrice as string;
        const sort = searchParams.sort as string;
        const delivery = searchParams.delivery as string;

        if (category) query = query.eq("category", category);
        if (city) query = query.eq("city", city);
        if (condition) query = query.eq("condition", condition);
        if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        if (maxPrice) query = query.lte("price", parseInt(maxPrice));
        if (delivery === "true") query = query.eq("delivery_available", true);

        switch (sort) {
            case "price_asc": query = query.order("price", { ascending: true }); break;
            case "price_desc": query = query.order("price", { ascending: false }); break;
            default: query = query.order("created_at", { ascending: false });
        }

        const { data, count } = await query.limit(48);
        items = (data as HouseholdItem[]) || [];
        totalCount = count || 0;
        // Sort: items with photos first, no-photo items at end
        items.sort((a, b) => {
            const aHas = (a.household_item_photos?.length ?? 0) > 0 ? 0 : 1;
            const bHas = (b.household_item_photos?.length ?? 0) > 0 ? 0 : 1;
            return aHas - bHas;
        });
    } catch {
        // Supabase not connected
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-20">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">No items found</h3>
                <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or check back later
                </p>
                <a
                    href="/marketplace"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    Clear Filters
                </a>
            </div>
        );
    }

    return (
        <>
            <p className="text-sm text-muted-foreground mb-4">
                {totalCount} {totalCount === 1 ? "item" : "items"} available
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {items.map((item) => (
                    <HouseholdItemCard key={item.id} item={item} />
                ))}
            </div>
        </>
    );
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export default function MarketplacePage({ searchParams }: Props) {
    const activeCategory = (searchParams.category as string) || "";

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="pt-20">
                {/* Header */}
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Home
                        </Link>
                        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
                            🛒 Used Household Items
                        </h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Quality furniture, electronics, and appliances from verified sellers.
                            Chat directly on WhatsApp — no middlemen.
                        </p>
                    </div>
                </div>

                {/* Category pills */}
                <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {CATEGORIES.map((cat) => (
                                <Link
                                    key={cat.value}
                                    href={cat.value ? `/marketplace?category=${cat.value}` : "/marketplace"}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${activeCategory === cat.value
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground hover:bg-muted border-input"
                                        }`}
                                >
                                    {cat.emoji} {cat.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar filters */}
                        <aside className="lg:col-span-1">
                            <form method="GET" action="/marketplace" className="space-y-5 p-5 rounded-2xl bg-secondary/30 border">
                                {activeCategory && (
                                    <input type="hidden" name="category" value={activeCategory} />
                                )}

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            name="search"
                                            placeholder="Search items..."
                                            defaultValue={(searchParams.search as string) || ""}
                                            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">City</label>
                                    <select
                                        name="city"
                                        defaultValue={(searchParams.city as string) || ""}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">All Cities</option>
                                        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Condition</label>
                                    <select
                                        name="condition"
                                        defaultValue={(searchParams.condition as string) || ""}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Price</label>
                                    <input
                                        type="number"
                                        name="maxPrice"
                                        placeholder="No limit"
                                        defaultValue={(searchParams.maxPrice as string) || ""}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sort By</label>
                                    <select
                                        name="sort"
                                        defaultValue={(searchParams.sort as string) || ""}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Newest First</option>
                                        <option value="price_asc">Price: Low → High</option>
                                        <option value="price_desc">Price: High → Low</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="delivery"
                                        value="true"
                                        id="delivery"
                                        defaultChecked={searchParams.delivery === "true"}
                                        className="rounded border-input"
                                    />
                                    <label htmlFor="delivery" className="text-sm text-muted-foreground">Delivery available</label>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Apply Filters
                                </button>
                            </form>
                        </aside>

                        {/* Items grid */}
                        <div className="lg:col-span-3">
                            <Suspense fallback={<LoadingGrid />}>
                                <ItemGrid searchParams={searchParams} />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
