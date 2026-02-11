import Link from "next/link";
import {
    Building,
    FileText,
    Eye,
    Plus,
    Edit,
    Trash2,
    ImageIcon,
    CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getPropertyTypeLabel, getStatusColor } from "@/lib/utils";
import type { Property } from "@/lib/types";
import DeletePropertyButton from "./delete-button";

export default async function DashboardPage() {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let properties: Property[] = [];

    if (user) {
        const { data } = await supabase
            .from("properties")
            .select("*, property_photos(id), property_blocks(id)")
            .eq("agent_id", user.id)
            .order("created_at", { ascending: false });

        properties = (data as any[]) || [];
    }

    const publishedCount = properties.filter((p) => p.status === "published").length;
    const draftCount = properties.filter((p) => p.status === "draft").length;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your property listings
                    </p>
                </div>
                <Button asChild size="lg">
                    <Link href="/dashboard/properties/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Property
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Listings
                        </CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{properties.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Published
                        </CardTitle>
                        <Eye className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">
                            {publishedCount}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Drafts
                        </CardTitle>
                        <FileText className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">
                            {draftCount}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Properties Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Properties</CardTitle>
                </CardHeader>
                <CardContent>
                    {properties.length === 0 ? (
                        <div className="text-center py-12">
                            <Building className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="font-semibold text-lg mb-1">No properties yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Add your first property listing to get started
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/properties/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Property
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="py-3 pr-4 font-medium">Property</th>
                                        <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                                            Type
                                        </th>
                                        <th className="py-3 pr-4 font-medium">Rent</th>
                                        <th className="py-3 pr-4 font-medium">Status</th>
                                        <th className="py-3 pr-4 font-medium hidden md:table-cell">
                                            Photos
                                        </th>
                                        <th className="py-3 pr-4 font-medium hidden md:table-cell">
                                            Blocked
                                        </th>
                                        <th className="py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.map((property) => (
                                        <tr key={property.id} className="border-b last:border-0">
                                            <td className="py-3 pr-4">
                                                <div className="font-medium line-clamp-1">
                                                    {property.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {property.area}, {property.city}
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4 hidden sm:table-cell">
                                                {getPropertyTypeLabel(property.type)}
                                            </td>
                                            <td className="py-3 pr-4">
                                                {formatCurrency(property.rent, property.currency)}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <Badge
                                                    className={getStatusColor(property.status)}
                                                    variant="secondary"
                                                >
                                                    {property.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 pr-4 hidden md:table-cell">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <ImageIcon className="h-3.5 w-3.5" />
                                                    {property.property_photos?.length || 0}
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4 hidden md:table-cell">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {property.property_blocks?.length || 0}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1">
                                                    <Button asChild variant="ghost" size="icon">
                                                        <Link
                                                            href={`/dashboard/properties/${property.id}/edit`}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <DeletePropertyButton propertyId={property.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
