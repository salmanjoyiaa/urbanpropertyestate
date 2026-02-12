import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://urbanpropertyestate.vercel.app";

    const staticPages: MetadataRoute.Sitemap = [
        { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        { url: `${siteUrl}/properties`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${siteUrl}/marketplace`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
        { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    ];

    // Dynamic property pages
    try {
        const supabase = createClient();
        const { data: properties } = await supabase
            .from("properties")
            .select("id, updated_at")
            .eq("status", "published")
            .order("updated_at", { ascending: false })
            .limit(500);

        const propertyPages: MetadataRoute.Sitemap = (properties || []).map((p) => ({
            url: `${siteUrl}/properties/${p.id}`,
            lastModified: new Date(p.updated_at),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

        return [...staticPages, ...propertyPages];
    } catch {
        return staticPages;
    }
}
