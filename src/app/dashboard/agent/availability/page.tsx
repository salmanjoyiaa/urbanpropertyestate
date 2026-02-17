import { createClient } from "@/lib/supabase/server";
import { requireAgent } from "@/lib/auth/guards";
import AvailabilityManager from "./availability-manager";

export default async function AvailabilityPage() {
    const { user } = await requireAgent();
    const supabase = createClient();

    // Fetch agent's properties
    const { data: properties } = await supabase
        .from("properties")
        .select("id, title, status")
        .eq("agent_id", user.id)
        .eq("status", "published")
        .order("title", { ascending: true });

    // Fetch existing slots for agent's properties
    const propertyIds = (properties || []).map((p) => p.id);
    let slots: Record<string, unknown>[] = [];
    if (propertyIds.length > 0) {
        const { data } = await supabase
            .from("availability_slots")
            .select("id, property_id, slot_date, start_time, end_time, capacity, is_available, created_at")
            .in("property_id", propertyIds)
            .order("slot_date", { ascending: true })
            .order("start_time", { ascending: true });
        slots = data || [];
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-bold">Manage Availability</h1>
                <p className="text-muted-foreground mt-1">
                    Define visit time slots for your properties
                </p>
            </div>

            <AvailabilityManager
                properties={(properties || []) as { id: string; title: string; status: string }[]}
                initialSlots={slots as never[]}
            />
        </div>
    );
}
