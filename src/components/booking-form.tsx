"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, CheckCircle2, Loader2 } from "lucide-react";
import {
    addDays,
    addMonths,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createBooking } from "@/actions/bookings";
import type { AvailabilitySlot } from "@/lib/types";

interface BookingFormProps {
    propertyId: string;
    propertyTitle: string;
    slots: AvailabilitySlot[];
}

export default function BookingForm({
    propertyId,
    propertyTitle,
    slots,
}: BookingFormProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [nationality, setNationality] = useState("");
    const [email, setEmail] = useState("");
    const [honeypot, setHoneypot] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message?: string;
        error?: string;
    } | null>(null);

    // Group slots by date
    const slotsByDate = useMemo(() => {
        const grouped: Record<string, AvailabilitySlot[]> = {};
        for (const slot of slots) {
            if (!grouped[slot.slot_date]) {
                grouped[slot.slot_date] = [];
            }
            grouped[slot.slot_date].push(slot);
        }
        // Sort dates
        return Object.fromEntries(
            Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
        );
    }, [slots]);

    const availableDates = Object.keys(slotsByDate);
    const slotsForSelectedDate = selectedDate ? slotsByDate[selectedDate] || [] : [];
    const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);

    const selectedSlot = slots.find((s) => s.id === selectedSlotId);

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

    useEffect(() => {
        if (selectedDate && !availableDateSet.has(selectedDate)) {
            setSelectedDate(null);
            setSelectedSlotId(null);
        }
    }, [availableDateSet, selectedDate]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
        const days: Date[] = [];
        let day = startDate;
        while (day <= endDate) {
            days.push(day);
            day = addDays(day, 1);
        }
        return days;
    }, [currentMonth]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedSlotId) return;

        setLoading(true);
        setResult(null);

        const res = await createBooking({
            propertyId,
            slotId: selectedSlotId,
            customerName: name,
            customerPhone: phone,
            customerNationality: nationality || undefined,
            customerEmail: email || undefined,
            honeypot: honeypot || undefined,
        });

        setResult(res);
        setLoading(false);
    }

    if (result?.success) {
        return (
            <div className="rounded-2xl border p-6 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="font-display text-xl font-semibold">Visit Request Submitted!</h3>
                <p className="text-muted-foreground text-sm">
                    {result.message || "You will receive a confirmation email once your visit is approved."}
                </p>
                {selectedSlot && (
                    <div className="bg-secondary/50 rounded-lg p-4 text-sm">
                        <p className="font-medium">{propertyTitle}</p>
                        <p className="text-muted-foreground">
                            {formatDate(selectedSlot.slot_date)} at{" "}
                            {formatTime(selectedSlot.start_time)} -{" "}
                            {formatTime(selectedSlot.end_time)}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border p-6 space-y-6">
            <div>
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Schedule a Visit
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Select a date and time to request a visit
                </p>
            </div>

            {/* Date Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Select Date</Label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                            className="px-2 py-1 rounded-md border text-xs hover:bg-secondary"
                        >
                            Prev
                        </button>
                        <span className="text-sm font-medium">
                            {format(currentMonth, "MMMM yyyy")}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                            className="px-2 py-1 rounded-md border text-xs hover:bg-secondary"
                        >
                            Next
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const isAvailable = availableDateSet.has(dateStr);
                        const isSelected = selectedDate === dateStr;
                        const isToday = isSameDay(day, new Date());

                        return (
                            <button
                                key={dateStr}
                                type="button"
                                onClick={() => {
                                    if (!isAvailable) return;
                                    setSelectedDate(dateStr);
                                    setSelectedSlotId(null);
                                }}
                                className={`h-10 rounded-lg border text-sm transition-colors ${
                                    !isSameMonth(day, currentMonth)
                                        ? "text-muted-foreground/40 border-border"
                                        : isSelected
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : isAvailable
                                        ? "hover:bg-secondary/80 border-border"
                                        : "text-muted-foreground border-border"
                                } ${isToday ? "ring-1 ring-primary/40" : ""}`}
                                disabled={!isAvailable}
                            >
                                {format(day, "d")}
                            </button>
                        );
                    })}
                </div>

                {availableDates.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                        No visit slots are available yet. Please check back later.
                    </p>
                )}
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Time</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {slotsForSelectedDate.map((slot) => (
                            <button
                                key={slot.id}
                                type="button"
                                onClick={() => setSelectedSlotId(slot.id)}
                                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                                    selectedSlotId === slot.id
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "hover:bg-secondary/80 border-border"
                                }`}
                            >
                                <Clock className="h-3.5 w-3.5" />
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Booking Form */}
            {selectedSlotId && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-2">
                        <Badge variant="secondary" className="shrink-0">
                            Selected
                        </Badge>
                        <span className="text-sm">
                            {selectedDate && formatDate(selectedDate)},{" "}
                            {selectedSlot && (
                                <>
                                    {formatTime(selectedSlot.start_time)} -{" "}
                                    {formatTime(selectedSlot.end_time)}
                                </>
                            )}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                required
                                minLength={2}
                                maxLength={100}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                type="tel"
                                required
                                minLength={7}
                                maxLength={20}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+971 50 123 4567"
                            />
                        </div>
                        <div>
                            <Label htmlFor="nationality">Nationality</Label>
                            <Input
                                id="nationality"
                                value={nationality}
                                onChange={(e) => setNationality(e.target.value)}
                                placeholder="e.g. Indian, British"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email (optional)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>

                    {/* Honeypot - hidden from real users */}
                    <div className="absolute -left-[9999px]" aria-hidden="true">
                        <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                        />
                    </div>

                    {result?.error && (
                        <p className="text-sm text-red-500">{result.error}</p>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CalendarDays className="h-4 w-4 mr-2" />
                                Request Visit
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                        You will receive a confirmation email after admin review
                    </p>
                </form>
            )}
        </div>
    );
}
