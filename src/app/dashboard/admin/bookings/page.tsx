import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/badge";
import RequestActions from "../leads/request-actions";

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
};

export default async function AdminBookingsPage() {
    await requireAdmin();
    const supabase = createClient();

    const { data: bookings } = await supabase
        .from("bookings")
        .select(
            "id, customer_name, customer_phone, customer_nationality, customer_email, status, created_at, property:properties(title, agent:profiles(name)), availability_slot:availability_slots(slot_date, start_time, end_time)"
        )
        .order("created_at", { ascending: false })
        .limit(200);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const h = parseInt(hours);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-bold">All Bookings</h1>
                <p className="text-muted-foreground mt-1">
                    View and manage all visit bookings across the platform
                </p>
            </div>

            <div className="rounded-xl border bg-background overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-secondary/30">
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Property</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Agent</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Visit Date</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(bookings || []).map((b) => {
                                const property = b.property as unknown as {
                                    title: string;
                                    agent: { name: string } | null;
                                } | null;
                                const slot = b.availability_slot as unknown as {
                                    slot_date: string;
                                    start_time: string;
                                    end_time: string;
                                } | null;

                                return (
                                    <tr key={b.id} className="border-b last:border-b-0">
                                        <td className="p-4">
                                            <div className="font-medium text-sm">{b.customer_name}</div>
                                            {b.customer_nationality && (
                                                <div className="text-xs text-muted-foreground">
                                                    {b.customer_nationality}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {property?.title || "-"}
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {property?.agent?.name || "-"}
                                        </td>
                                        <td className="p-4 text-sm">
                                            {slot ? (
                                                <div>
                                                    <div>{formatDate(slot.slot_date)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                    </div>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div>{b.customer_phone}</div>
                                            {b.customer_email && (
                                                <div className="text-xs text-muted-foreground">
                                                    {b.customer_email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <Badge className={statusColors[b.status] || ""}>
                                                {b.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <RequestActions
                                                entity="booking"
                                                id={b.id}
                                                currentStatus={b.status}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!bookings || bookings.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        No bookings found
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
