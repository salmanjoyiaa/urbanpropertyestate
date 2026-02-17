"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateUserRole } from "@/actions/admin";
import type { UserRole } from "@/lib/types";

interface Props {
    userId: string;
    currentRole: UserRole;
}

export default function RoleSelector({ userId, currentRole }: Props) {
    const [role, setRole] = useState<UserRole>(currentRole);
    const [loading, setLoading] = useState(false);

    async function handleChange(newRole: UserRole) {
        if (newRole === role) return;
        setLoading(true);
        const result = await updateUserRole(userId, newRole);
        if (result.success) {
            setRole(newRole);
        }
        setLoading(false);
    }

    if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin ml-auto" />;
    }

    return (
        <select
            value={role}
            onChange={(e) => handleChange(e.target.value as UserRole)}
            className="rounded-lg border bg-background px-2 py-1 text-sm"
        >
            <option value="customer">Customer</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
        </select>
    );
}
