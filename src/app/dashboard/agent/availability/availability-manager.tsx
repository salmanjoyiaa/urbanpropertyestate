"use client";

import { useState } from "react";
import {
    CalendarDays,
    Clock,
    Plus,
    Trash2,
    Loader2,
    Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    createAvailabilitySlot,
    deleteAvailabilitySlot,
    bulkCreateSlots,
} from "@/actions/availability";
import type { AvailabilitySlot } from "@/lib/types";

interface Props {
    properties: { id: string; title: string; status: string }[];
    initialSlots: AvailabilitySlot[];
}

export default function AvailabilityManager({ properties, initialSlots }: Props) {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
        properties[0]?.id || ""
    );
    const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state for new slot
    const [slotDate, setSlotDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");

    // Bulk generation
    const [bulkStartDate, setBulkStartDate] = useState("");
    const [bulkEndDate, setBulkEndDate] = useState("");
    const [bulkStartTime, setBulkStartTime] = useState("09:00");
    const [bulkEndTime, setBulkEndTime] = useState("17:00");
    const [slotDuration, setSlotDuration] = useState(60); // minutes
    const [showBulk, setShowBulk] = useState(false);

    const filteredSlots = slots.filter((s) => s.property_id === selectedPropertyId);
    const today = new Date().toISOString().split("T")[0];

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const h = parseInt(hours);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    async function handleAddSlot(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedPropertyId || !slotDate) return;

        setLoading(true);
        setError(null);

        const result = await createAvailabilitySlot({
            propertyId: selectedPropertyId,
            slotDate,
            startTime,
            endTime,
        });

        if (result.success && result.slotId) {
            setSlots((prev) => [
                ...prev,
                {
                    id: result.slotId!,
                    property_id: selectedPropertyId,
                    slot_date: slotDate,
                    start_time: startTime,
                    end_time: endTime,
                    capacity: 1,
                    is_available: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ]);
            setSlotDate("");
        } else {
            setError(result.error || "Failed to create slot");
        }
        setLoading(false);
    }

    async function handleDeleteSlot(slotId: string) {
        setLoading(true);
        const result = await deleteAvailabilitySlot(slotId);
        if (result.success) {
            setSlots((prev) => prev.filter((s) => s.id !== slotId));
        } else {
            setError(result.error || "Failed to delete slot");
        }
        setLoading(false);
    }

    async function handleBulkCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedPropertyId || !bulkStartDate || !bulkEndDate) return;

        setLoading(true);
        setError(null);

        // Generate slots from date range
        const generatedSlots: { slotDate: string; startTime: string; endTime: string }[] = [];
        const start = new Date(bulkStartDate);
        const end = new Date(bulkEndDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0];
            // Generate time slots within the day
            const [startH, startM] = bulkStartTime.split(":").map(Number);
            const [endH, endM] = bulkEndTime.split(":").map(Number);
            let currentMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            while (currentMinutes + slotDuration <= endMinutes) {
                const sh = Math.floor(currentMinutes / 60);
                const sm = currentMinutes % 60;
                const eh = Math.floor((currentMinutes + slotDuration) / 60);
                const em = (currentMinutes + slotDuration) % 60;

                generatedSlots.push({
                    slotDate: dateStr,
                    startTime: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
                    endTime: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
                });

                currentMinutes += slotDuration;
            }
        }

        const result = await bulkCreateSlots({
            propertyId: selectedPropertyId,
            slots: generatedSlots,
        });

        if (result.success) {
            // Reload page to get fresh data
            window.location.reload();
        } else {
            setError(result.error || "Failed to create slots");
        }
        setLoading(false);
    }

    if (properties.length === 0) {
        return (
            <div className="rounded-xl border bg-background p-8 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                    You need at least one published property to manage availability
                </p>
                <Button asChild>
                    <a href="/dashboard/properties/new">Create a Property</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Property Selector */}
            <div className="space-y-2">
                <Label>Select Property</Label>
                <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                    {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.title}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Single Slot */}
                <div className="rounded-xl border bg-background p-6 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Time Slot
                    </h3>
                    <form onSubmit={handleAddSlot} className="space-y-4">
                        <div>
                            <Label htmlFor="slotDate">Date</Label>
                            <Input
                                id="slotDate"
                                type="date"
                                required
                                min={today}
                                value={slotDate}
                                onChange={(e) => setSlotDate(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    required
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    required
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            Add Slot
                        </Button>
                    </form>

                    <div className="pt-2 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBulk(!showBulk)}
                            className="w-full"
                        >
                            {showBulk ? "Hide" : "Show"} Bulk Generator
                        </Button>
                    </div>

                    {showBulk && (
                        <form onSubmit={handleBulkCreate} className="space-y-4 pt-2 border-t">
                            <h4 className="text-sm font-medium">Generate Slots for Date Range</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>From</Label>
                                    <Input
                                        type="date"
                                        required
                                        min={today}
                                        value={bulkStartDate}
                                        onChange={(e) => setBulkStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>To</Label>
                                    <Input
                                        type="date"
                                        required
                                        min={bulkStartDate || today}
                                        value={bulkEndDate}
                                        onChange={(e) => setBulkEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Day Start</Label>
                                    <Input
                                        type="time"
                                        required
                                        value={bulkStartTime}
                                        onChange={(e) => setBulkStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Day End</Label>
                                    <Input
                                        type="time"
                                        required
                                        value={bulkEndTime}
                                        onChange={(e) => setBulkEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Slot Duration (minutes)</Label>
                                <select
                                    value={slotDuration}
                                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                >
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                </select>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                )}
                                Generate Slots
                            </Button>
                        </form>
                    )}
                </div>

                {/* Existing Slots */}
                <div className="rounded-xl border bg-background p-6 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Upcoming Slots ({filteredSlots.filter((s) => s.slot_date >= today).length})
                    </h3>
                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
                    )}
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {filteredSlots
                            .filter((s) => s.slot_date >= today)
                            .map((slot) => (
                                <div
                                    key={slot.id}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-medium text-sm">
                                                {formatDate(slot.slot_date)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={slot.is_available ? "default" : "secondary"}
                                            className="text-xs"
                                        >
                                            {slot.is_available ? "Available" : "Booked"}
                                        </Badge>
                                    </div>
                                    {slot.is_available && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        {filteredSlots.filter((s) => s.slot_date >= today).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                No upcoming slots. Add some using the form.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
