"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminUpdateBookingStatus } from "@/actions/admin";
import { adminUpdateMarketplaceRequestStatus } from "@/actions/marketplace-requests";

interface RequestActionsProps {
    entity: "booking" | "marketplace_request";
    id: string;
    currentStatus: string;
}

export default function RequestActions({ entity, id, currentStatus }: RequestActionsProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(currentStatus);

    async function handleApprove() {
        setLoading(true);
        const result =
            entity === "booking"
                ? await adminUpdateBookingStatus(id, "confirmed")
                : await adminUpdateMarketplaceRequestStatus(id, "approved");
        if (result.success) setStatus(entity === "booking" ? "confirmed" : "approved");
        setLoading(false);
    }

    async function handleReject() {
        setLoading(true);
        const result =
            entity === "booking"
                ? await adminUpdateBookingStatus(id, "cancelled")
                : await adminUpdateMarketplaceRequestStatus(id, "rejected");
        if (result.success) setStatus(entity === "booking" ? "cancelled" : "rejected");
        setLoading(false);
    }

    if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }

    if (status !== "pending") {
        return <span className="text-xs text-muted-foreground capitalize">{status}</span>;
    }

    return (
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleApprove} title="Approve">
                <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReject} title="Reject">
                <X className="h-4 w-4 text-red-500" />
            </Button>
        </div>
    );
}
