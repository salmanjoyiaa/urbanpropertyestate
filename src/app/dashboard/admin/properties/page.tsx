import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { formatCurrency } from "@/lib/utils";
import { adminDeleteProperty } from "@/actions/admin";

export default async function AdminPropertiesPage() {
    await requireAdmin();
    const supabase = createClient();

    const { data: properties } = await supabase
        .from("properties")
        .select("id, title, type, rent, currency, city, area, status, created_at, agent:profiles(name)")
        .order("created_at", { ascending: false })
        .limit(100);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-bold">All Properties</h1>
                <p className="text-muted-foreground mt-1">
                    Manage all property listings across the platform
                </p>
            </div>

            <div className="rounded-xl border bg-background overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-secondary/30">
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Property</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Agent</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Location</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rent</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(properties || []).map((property) => (
                                <tr key={property.id} className="border-b last:border-b-0">
                                    <td className="p-4 font-medium text-sm">{property.title}</td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {(property.agent as unknown as { name: string })?.name || "-"}
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
                                        <div className="flex items-center justify-end gap-1">
                                            <Button asChild variant="ghost" size="sm">
                                                <Link href={`/properties/${property.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <form
                                                action={async () => {
                                                    "use server";
                                                    await adminDeleteProperty(property.id);
                                                }}
                                            >
                                                <Button variant="ghost" size="sm" type="submit">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!properties || properties.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No properties found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
