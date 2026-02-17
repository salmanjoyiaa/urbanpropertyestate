import { createClient } from "@/lib/supabase/server";

export async function logAudit(
    actorId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata: Record<string, unknown> = {}
) {
    try {
        const supabase = createClient();
        await supabase.from("audit_logs").insert({
            actor_id: actorId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            metadata,
        });
    } catch (error) {
        // Audit logging should never block the main operation
        console.error("Audit log error:", error);
    }
}
