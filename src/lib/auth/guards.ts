import { redirect } from "next/navigation";
import { getSession, getUserRole } from "./session";
import type { UserRole } from "@/lib/types";

export async function requireAuth() {
    const user = await getSession();
    if (!user) {
        redirect("/login");
    }
    return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
    const user = await requireAuth();
    const role = await getUserRole();

    if (!role || !allowedRoles.includes(role)) {
        redirect("/");
    }

    return { user, role };
}

export async function requireAgent() {
    return requireRole(["agent", "admin"]);
}

export async function requireAdmin() {
    return requireRole(["admin"]);
}
