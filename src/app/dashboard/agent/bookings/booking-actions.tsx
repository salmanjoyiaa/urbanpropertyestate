"use client";

import { useState } from "react";
import { Check, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateBookingStatus } from "@/actions/bookings";

interface Props {
    bookingId: string;
    currentStatus: string;
}

export default function BookingActions({ bookingId, currentStatus }: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(currentStatus);

    async function handleStatusChange(newStatus: "confirmed" | "cancelled" | "completed") {
        setLoading(true);
        const result = await updateBookingStatus(bookingId, newStatus);
        if (result.success) {
            setStatus(newStatus);
        }
        setLoading(false);
    }

    if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }

    if (status === "pending") {
        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange("confirmed")}
                    title="Confirm"
                >
                    <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange("cancelled")}
                    title="Cancel"
                >
                    <X className="h-4 w-4 text-red-500" />
                </Button>
            </div>
        );
    }

    if (status === "confirmed") {
        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange("completed")}
                    title="Mark Complete"
                >
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange("cancelled")}
                    title="Cancel"
                >
                    <X className="h-4 w-4 text-red-500" />
                </Button>
            </div>
        );
    }

    return <span className="text-xs text-muted-foreground capitalize">{status}</span>;
}
