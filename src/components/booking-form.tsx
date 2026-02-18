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
import { Dialog, DialogBody, DialogHeader } from "@/components/ui/dialog";
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
    const [open, setOpen] = useState(false);
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
            customerEmail: email,
            honeypot: honeypot || undefined,
        });

        setResult(res);
        setLoading(false);
    }

    function handleClose() {
        if (!loading) {
            setOpen(false);
            if (result?.success) {
                setResult(null);
                setSelectedDate(null);
                setSelectedSlotId(null);
                setName("");
                setPhone("");
                setNationality("");
                setEmail("");
            }
        }
    }

    return (
        <>
            {/* Trigger Button */}
            <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => setOpen(true)}
            >
                <CalendarDays className="h-5 w-5 mr-2" />
                Schedule a Visit
            </Button>

            <Dialog open={open} onOpenChange={handleClose}>
                {result?.success ? (
                    <>
                        <DialogHeader onClose={handleClose}>
                            <span />
                        </DialogHeader>
                        <DialogBody className="text-center space-y-4 pt-2">
                            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
                            <h3 className="font-display text-xl font-semibold">Visit Request Submitted!</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                {result.message || "You will receive a confirmation email once your visit is approved."}
                            </p>
                            {selectedSlot && selectedDate && (
                                <div className="bg-secondary/50 rounded-lg p-4 text-sm">
                                    <p className="font-medium">{propertyTitle}</p>
                                    <p className="text-muted-foreground">
                                        {formatDate(selectedDate)} at{" "}
                                        {formatTime(selectedSlot.start_time)} -{" "}
                                        {formatTime(selectedSlot.end_time)}
                                    </p>
                                </div>
                            )}
                            <Button onClick={handleClose} variant="secondary" className="mt-2">
                                Close
                            </Button>
                        </DialogBody>
                    </>
                ) : (
                    <>
                        <DialogHeader onClose={handleClose}>
                            <div>
                                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-primary" />
                                    Schedule a Visit
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {propertyTitle}
                                </p>
                            </div>
                        </DialogHeader>
                        <DialogBody className="space-y-5">
                            {/* Calendar */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Select Date</Label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                                            className="px-2 py-1 rounded-md border text-xs hover:bg-secondary transition-colors"
                                        >
                                            Prev
                                        </button>
                                        <span className="text-sm font-medium min-w-[120px] text-center">
                                            {format(currentMonth, "MMMM yyyy")}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                                            className="px-2 py-1 rounded-md border text-xs hover:bg-secondary transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
                                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                        <div key={d} className="text-center font-medium py-1">
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((day) => {
                                        const dateStr = format(day, "yyyy-MM-dd");
                                        const isAvailable = availableDateSet.has(dateStr);
                                        const isSelected = selectedDate === dateStr;
                                        const isToday = isSameDay(day, new Date());
                                        const inMonth = isSameMonth(day, currentMonth);

                                        return (
                                            <button
                                                key={dateStr}
                                                type="button"
                                                onClick={() => {
                                                    if (!isAvailable) return;
                                                    setSelectedDate(dateStr);
                                                    setSelectedSlotId(null);
                                                }}
                                                className={`h-9 w-full rounded-lg text-sm transition-all ${
                                                    !inMonth
                                                        ? "text-muted-foreground/30"
                                                        : isSelected
                                                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                                        : isAvailable
                                                        ? "hover:bg-primary/10 text-foreground font-medium bg-emerald-50 dark:bg-emerald-950/20"
                                                        : "text-muted-foreground/50"
                                                } ${isToday && !isSelected ? "ring-1 ring-primary/40" : ""}`}
                                                disabled={!isAvailable || !inMonth}
                                            >
                                                {format(day, "d")}
                                            </button>
                                        );
                                    })}
                                </div>

                                {availableDates.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                        No visit slots available yet. Check back later.
                                    </p>
                                )}
                            </div>

                            {/* Time Slots */}
                            {selectedDate && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Available Times &mdash; {formatDate(selectedDate)}
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {slotsForSelectedDate.map((slot) => (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => setSelectedSlotId(slot.id)}
                                                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all ${
                                                    selectedSlotId === slot.id
                                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                        : "hover:bg-secondary/80 border-border hover:border-primary/30"
                                                }`}
                                            >
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Form Fields */}
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
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Honeypot */}
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
                                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                                            <p className="text-sm text-red-600">{result.error}</p>
                                        </div>
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
                        </DialogBody>
                    </>
                )}
            </Dialog>
        </>
    );
}
