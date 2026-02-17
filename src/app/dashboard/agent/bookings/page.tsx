import { createClient } from "@/lib/supabase/server";
import { requireAgent } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/badge";
import BookingActions from "./booking-actions";
import type { Booking } from "@/lib/types";

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
};

export default async function AgentBookingsPage() {
    const { user } = await requireAgent();
    const supabase = createClient();

    // Fetch agent's properties
    const { data: properties } = await supabase
        .from("properties")
        .select("id, title")
        .eq("agent_id", user.id);

    const propertyIds = (properties || []).map((p) => p.id);
    const propertyMap = Object.fromEntries(
        (properties || []).map((p) => [p.id, p.title])
    );

    // Fetch bookings for agent's properties
    let bookings: Booking[] = [];
    if (propertyIds.length > 0) {
        const { data } = await supabase
            .from("bookings")
            .select("id, property_id, slot_id, customer_name, customer_phone, customer_nationality, customer_email, status, created_at, availability_slot:availability_slots(slot_date, start_time, end_time)")
            .in("property_id", propertyIds)
            .order("created_at", { ascending: false })
            .limit(100);
        bookings = (data || []) as unknown as Booking[];
    }

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
                <h1 className="font-display text-3xl font-bold">Visit Bookings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage visit requests from potential tenants
                </p>
            </div>

            {bookings.length === 0 ? (
                <div className="rounded-xl border bg-background p-8 text-center">
                    <p className="text-muted-foreground">
                        No bookings yet. Make sure you have availability slots set up.
                    </p>
                </div>
            ) : (
                <div className="rounded-xl border bg-background overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-secondary/30">
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Property</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Visit Date</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => {
                                    const slot = booking.availability_slot as unknown as {
                                        slot_date: string;
                                        start_time: string;
                                        end_time: string;
                                    } | null;

                                    return (
                                        <tr key={booking.id} className="border-b last:border-b-0">
                                            <td className="p-4">
                                                <div className="font-medium text-sm">{booking.customer_name}</div>
                                                {booking.customer_nationality && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {booking.customer_nationality}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {propertyMap[booking.property_id] || "Unknown"}
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
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div>{booking.customer_phone}</div>
                                                {booking.customer_email && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {booking.customer_email}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    className={statusColors[booking.status] || ""}
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <BookingActions
                                                    bookingId={booking.id}
                                                    currentStatus={booking.status}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
