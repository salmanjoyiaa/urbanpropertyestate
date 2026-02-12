import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, Eye, MessageSquare, Users, TrendingUp,
    Building2, BarChart3
} from "lucide-react";

export default async function AnalyticsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch agent's properties
    const { data: properties } = await supabase
        .from("properties")
        .select("id, title, city, rent, currency, status, created_at, property_photos(url, is_cover)")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false });

    // Fetch agent's leads
    const { data: leads } = await supabase
        .from("leads")
        .select("id, property_id, temperature, status, created_at")
        .eq("agent_id", user.id);

    const allProperties = properties || [];
    const allLeads = leads || [];

    const publishedCount = allProperties.filter((p) => p.status === "published").length;
    const draftCount = allProperties.filter((p) => p.status === "draft").length;
    const convertedLeads = allLeads.filter((l) => l.status === "converted").length;
    const conversionRate = allLeads.length > 0 ? Math.round((convertedLeads / allLeads.length) * 100) : 0;

    // Leads per property
    const leadsByProperty = allLeads.reduce<Record<string, number>>((acc, lead) => {
        if (lead.property_id) {
            acc[lead.property_id] = (acc[lead.property_id] || 0) + 1;
        }
        return acc;
    }, {});

    // Recent leads (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentLeads = allLeads.filter((l) => l.created_at >= oneWeekAgo).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold">Analytics</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Performance overview for your listings
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Dashboard
                    </Link>
                </Button>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{publishedCount}</p>
                                <p className="text-xs text-muted-foreground">Published</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Users className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allLeads.length}</p>
                                <p className="text-xs text-muted-foreground">Total Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{recentLeads}</p>
                                <p className="text-xs text-muted-foreground">This Week</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{conversionRate}%</p>
                                <p className="text-xs text-muted-foreground">Conversion</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Listing Performance Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="p-4 border-b">
                        <h2 className="font-display font-semibold">Listing Performance</h2>
                    </div>
                    {allProperties.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No listings yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="text-left p-3 font-medium text-muted-foreground">Property</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground">City</th>
                                        <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                                        <th className="text-center p-3 font-medium text-muted-foreground">Leads</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground">Listed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allProperties.map((property) => {
                                        const propertyLeads = leadsByProperty[property.id] || 0;
                                        return (
                                            <tr key={property.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="p-3">
                                                    <Link href={`/properties/${property.id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                                                        {property.title}
                                                    </Link>
                                                </td>
                                                <td className="p-3 text-muted-foreground">{property.city}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${property.status === "published"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-amber-100 text-amber-800"
                                                        }`}>
                                                        {property.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`font-medium ${propertyLeads > 0 ? "text-primary" : "text-muted-foreground"}`}>
                                                        {propertyLeads}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right text-muted-foreground">
                                                    {new Date(property.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
