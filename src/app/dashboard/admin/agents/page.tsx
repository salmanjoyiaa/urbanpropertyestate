import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/badge";
import RoleSelector from "./role-selector";
import type { Profile } from "@/lib/types";

export default async function AdminAgentsPage() {
    await requireAdmin();
    const supabase = createClient();

    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, phone, whatsapp_number, role, created_at")
        .order("role", { ascending: true })
        .order("name", { ascending: true })
        .limit(200);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage user roles and permissions
                </p>
            </div>

            <div className="rounded-xl border bg-background overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-secondary/30">
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Phone</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Current Role</th>
                                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Change Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(profiles || []).map((profile) => (
                                <tr key={profile.id} className="border-b last:border-b-0">
                                    <td className="p-4 font-medium text-sm">{profile.name || "-"}</td>
                                    <td className="p-4 text-sm text-muted-foreground">{profile.phone || "-"}</td>
                                    <td className="p-4">
                                        <Badge
                                            variant={
                                                profile.role === "admin"
                                                    ? "destructive"
                                                    : profile.role === "agent"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            {profile.role}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <RoleSelector
                                            userId={profile.id}
                                            currentRole={profile.role as Profile["role"]}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {(!profiles || profiles.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        No users found
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
