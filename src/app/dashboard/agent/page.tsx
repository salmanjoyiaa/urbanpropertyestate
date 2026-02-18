import Link from "next/link";
import {
    Building2,
    Plus,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireAgent } from "@/lib/auth/guards";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/lib/types";

export default async function AgentDashboardPage() {
    const { user } = await requireAgent();
    const supabase = createClient();

    // Fetch agent's properties
    const { data: properties } = await supabase
        .from("properties")
        .select("id, title, type, rent, currency, city, area, status, created_at, property_photos(url, is_cover)")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false });

    const publishedCount = (properties || []).filter((p) => p.status === "published").length;
    const draftCount = (properties || []).filter((p) => p.status === "draft").length;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold">Agent Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your listings and review approved visit leads
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/properties/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Property
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md">
                <div className="rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">Published</span>
                    </div>
                    <div className="text-2xl font-bold">{publishedCount}</div>
                    {draftCount > 0 && (
                        <p className="text-xs text-muted-foreground">{draftCount} drafts</p>
                    )}
                </div>
            </div>

            {/* Properties Table */}
            <div>
                <h2 className="font-display text-xl font-semibold mb-4">Your Properties</h2>
                {!properties || properties.length === 0 ? (
                    <div className="rounded-xl border bg-background p-8 text-center">
                        <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No properties yet</p>
                        <Button asChild>
                            <Link href="/dashboard/properties/new">Create Your First Listing</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="rounded-xl border bg-background overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-secondary/30">
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Property</th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Location</th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rent</th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(properties as Property[]).map((property) => (
                                        <tr key={property.id} className="border-b last:border-b-0">
                                            <td className="p-4">
                                                <span className="font-medium">{property.title}</span>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {property.area}, {property.city}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {formatCurrency(property.rent, property.currency)}
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={property.status === "published" ? "default" : "secondary"}>
                                                    {property.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/properties/${property.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/dashboard/properties/${property.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
