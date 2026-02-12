"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" },
];

export default function LeadStatusSelect({
    leadId,
    currentStatus,
}: {
    leadId: string;
    currentStatus: string;
}) {
    const [status, setStatus] = useState(currentStatus || "new");
    const [saving, setSaving] = useState(false);

    const handleChange = async (newStatus: string) => {
        setStatus(newStatus);
        setSaving(true);
        try {
            const supabase = createClient();
            await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
        } catch {
            setStatus(currentStatus);
        } finally {
            setSaving(false);
        }
    };

    return (
        <select
            value={status}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            className="text-xs rounded-md border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
        >
            {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
