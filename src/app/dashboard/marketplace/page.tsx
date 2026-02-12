import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Plus, Edit, Trash2, Tag, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { HouseholdItem } from "@/lib/types";

export default async function MarketplaceDashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let items: HouseholdItem[] = [];

    if (user) {
        const { data } = await supabase
            .from("household_items")
            .select("*, household_item_photos(id, url, is_cover)")
            .eq("seller_id", user.id)
            .order("created_at", { ascending: false });

        items = (data as HouseholdItem[]) || [];
    }

    const availableCount = items.filter((i) => i.status === "available").length;
    const soldCount = items.filter((i) => i.status === "sold").length;
    const totalRevenue = items.filter((i) => i.status === "sold").reduce((sum, i) => sum + i.price, 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold">My Marketplace</h1>
                    <p className="text-muted-foreground mt-1">Manage your household items</p>
                </div>
                <Button asChild size="lg">
                    <Link href="/dashboard/marketplace/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{items.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
                        <Tag className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">{availableCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Sold</CardTitle>
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{soldCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Items</CardTitle>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <div className="py-12 text-center">
                            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground mb-4">No items yet</p>
                            <Button asChild>
                                <Link href="/dashboard/marketplace/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Item
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-sm text-muted-foreground">
                                        <th className="text-left py-3 px-2">Item</th>
                                        <th className="text-left py-3 px-2">Category</th>
                                        <th className="text-left py-3 px-2">Price</th>
                                        <th className="text-left py-3 px-2">Status</th>
                                        <th className="text-right py-3 px-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => {
                                        const coverPhoto = item.household_item_photos?.find((p) => p.is_cover) || item.household_item_photos?.[0];
                                        return (
                                            <tr key={item.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                                                            {coverPhoto ? (
                                                                <Image src={coverPhoto.url} alt={item.title} width={48} height={48} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium line-clamp-1">{item.title}</div>
                                                            <div className="text-xs text-muted-foreground">{item.city}, {item.area}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 capitalize">{item.category}</td>
                                                <td className="py-3 px-2 font-semibold">{formatCurrency(item.price, item.currency)}</td>
                                                <td className="py-3 px-2">
                                                    <Badge variant={item.status === "available" ? "default" : item.status === "sold" ? "secondary" : "outline"}>
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" variant="ghost" asChild>
                                                            <Link href={`/dashboard/marketplace/${item.id}/edit`}>
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </Link>
                                                        </Button>
                                                        <form action={async () => {
                                                            "use server";
                                                            const supabase = createClient();
                                                            await supabase.from("household_items").delete().eq("id", item.id);
                                                        }}>
                                                            <Button size="sm" variant="ghost" type="submit">
                                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                            </Button>
                                                        </form>
                                                    </div>
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
