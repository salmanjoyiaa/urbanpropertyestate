import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/badge";
import RequestActions from "./request-actions";

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
}

export default async function AdminLeadsPage() {
    await requireAdmin();
    const supabase = createClient();

    const { data: bookingRequests } = await supabase
        .from("bookings")
        .select("id, customer_name, customer_phone, customer_email, status, created_at, property:properties(title), availability_slot:availability_slots(slot_date, start_time, end_time)")
        .order("created_at", { ascending: false })
        .limit(100);

    const { data: marketplaceRequests } = await supabase
        .from("marketplace_requests")
        .select("id, customer_name, customer_phone, customer_email, status, created_at, item:household_items(title)")
        .order("created_at", { ascending: false })
        .limit(100);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-bold">Lead Requests</h1>
                <p className="text-muted-foreground mt-1">
                    Approve or reject customer visit and marketplace requests
                </p>
            </div>

            <div className="rounded-xl border bg-background overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">Property Visit Requests</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-secondary/30">
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Property</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Slot</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(bookingRequests || []).map((request) => {
                                const property = request.property as unknown as { title: string } | null;
                                const slot = request.availability_slot as unknown as { slot_date: string; start_time: string; end_time: string } | null;

                                return (
                                    <tr key={request.id} className="border-b last:border-b-0">
                                        <td className="p-4 text-sm">
                                            <div className="font-medium">{request.customer_name}</div>
                                            <div className="text-xs text-muted-foreground">{request.customer_phone}</div>
                                            {request.customer_email && <div className="text-xs text-muted-foreground">{request.customer_email}</div>}
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">{property?.title || "-"}</td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {slot ? `${slot.slot_date} ${slot.start_time} - ${slot.end_time}` : "-"}
                                        </td>
                                        <td className="p-4">
                                            <Badge className={statusColors[request.status] || ""}>{request.status}</Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <RequestActions entity="booking" id={request.id} currentStatus={request.status} />
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!bookingRequests || bookingRequests.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No visit requests found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-xl border bg-background overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">Marketplace Requests</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-secondary/30">
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Item</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Requested At</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(marketplaceRequests || []).map((request) => {
                                const item = request.item as unknown as { title: string } | null;

                                return (
                                    <tr key={request.id} className="border-b last:border-b-0">
                                        <td className="p-4 text-sm">
                                            <div className="font-medium">{request.customer_name}</div>
                                            <div className="text-xs text-muted-foreground">{request.customer_phone}</div>
                                            {request.customer_email && <div className="text-xs text-muted-foreground">{request.customer_email}</div>}
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">{item?.title || "-"}</td>
                                        <td className="p-4 text-sm text-muted-foreground">{formatDate(request.created_at)}</td>
                                        <td className="p-4">
                                            <Badge className={statusColors[request.status] || ""}>{request.status}</Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <RequestActions entity="marketplace_request" id={request.id} currentStatus={request.status} />
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!marketplaceRequests || marketplaceRequests.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No marketplace requests found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
