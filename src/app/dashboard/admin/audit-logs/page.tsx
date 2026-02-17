import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/badge";

export default async function AuditLogsPage() {
    await requireAdmin();
    const supabase = createClient();

    const { data: logs } = await supabase
        .from("audit_logs")
        .select("id, actor_id, action, entity_type, entity_id, metadata, created_at, actor:profiles(name)")
        .order("created_at", { ascending: false })
        .limit(200);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-bold">Audit Logs</h1>
                <p className="text-muted-foreground mt-1">
                    View all system actions and changes (append-only)
                </p>
            </div>

            <div className="rounded-xl border bg-background overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-secondary/30">
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actor</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Entity</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(logs || []).map((log) => (
                                <tr key={log.id} className="border-b last:border-b-0">
                                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-sm">
                                        {(log.actor as unknown as { name: string })?.name || (
                                            <span className="text-muted-foreground">System</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <Badge variant="outline" className="text-xs font-mono">
                                            {log.action}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {log.entity_type}
                                        {log.entity_id && (
                                            <span className="text-xs block font-mono opacity-50">
                                                {log.entity_id.slice(0, 8)}...
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs text-muted-foreground font-mono max-w-[200px] truncate">
                                        {log.metadata && Object.keys(log.metadata).length > 0
                                            ? JSON.stringify(log.metadata)
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                            {(!logs || logs.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        No audit logs yet
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
