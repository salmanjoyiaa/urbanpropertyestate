import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export async function getSession() {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

export async function getUserRole(): Promise<UserRole | null> {
    const user = await getSession();
    if (!user) return null;

    const supabase = createClient();
    const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    return (data?.role as UserRole) || null;
}

export async function getUserWithRole() {
    const user = await getSession();
    if (!user) return null;

    const supabase = createClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .single();

    if (!profile) return null;

    return {
        user,
        role: profile.role as UserRole,
        name: profile.name as string,
    };
}
