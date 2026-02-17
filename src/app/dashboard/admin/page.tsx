import {
    Building2,
    Users,
    ClipboardList,
    CalendarDays,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminDashboardPage() {
    await requireAdmin();
    const supabase = createClient();

    const { count: totalProperties } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true });

    const { count: publishedProperties } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "published");

    const { count: totalBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true });

    const { count: pendingBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

    const { count: totalAgents } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "agent");

    const today = new Date().toISOString().split("T")[0];
    const { count: totalSlots } = await supabase
        .from("availability_slots")
        .select("id", { count: "exact", head: true })
        .gte("slot_date", today)
        .eq("is_available", true);

    // Recent bookings
    const { data: recentBookings } = await supabase
        .from("bookings")
        .select("id, customer_name, status, created_at, property:properties(title)")
        .order("created_at", { ascending: false })
        .limit(10);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Platform overview and management
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">Properties</span>
                    </div>
                    <div className="text-2xl font-bold">{totalProperties || 0}</div>
                    <p className="text-xs text-muted-foreground">{publishedProperties || 0} published</p>
                </div>
                <div className="rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <ClipboardList className="h-4 w-4" />
                        <span className="text-sm">Bookings</span>
                    </div>
                    <div className="text-2xl font-bold">{totalBookings || 0}</div>
                    <p className="text-xs text-amber-500">{pendingBookings || 0} pending</p>
                </div>
                <div className="rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Agents</span>
                    </div>
                    <div className="text-2xl font-bold">{totalAgents || 0}</div>
                </div>
                <div className="rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-sm">Open Slots</span>
                    </div>
                    <div className="text-2xl font-bold">{totalSlots || 0}</div>
                </div>
            </div>

            {/* Recent Bookings */}
            <div>
                <h2 className="font-display text-xl font-semibold mb-4">Recent Bookings</h2>
                <div className="rounded-xl border bg-background overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-secondary/30">
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Property</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(recentBookings || []).map((b) => (
                                    <tr key={b.id} className="border-b last:border-b-0">
                                        <td className="p-4 text-sm font-medium">{b.customer_name}</td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {(b.property as unknown as { title: string })?.title || "-"}
                                        </td>
                                        <td className="p-4 text-sm capitalize">{b.status}</td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {new Date(b.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {(!recentBookings || recentBookings.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            No bookings yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
