"use client";

import { useMemo } from "react";
import {
    format,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    getDay,
    addMonths,
    isWithinInterval,
    parseISO,
    isSameMonth,
} from "date-fns";
import type { PropertyBlock } from "@/lib/types";

interface AvailabilityCalendarProps {
    blocks: PropertyBlock[];
}

export default function AvailabilityCalendar({
    blocks,
}: AvailabilityCalendarProps) {
    const today = new Date();
    const months = [today, addMonths(today, 1), addMonths(today, 2)];

    const isBlocked = useMemo(() => {
        return (date: Date) => {
            return blocks.some((block) => {
                const start = parseISO(block.start_date);
                const end = parseISO(block.end_date);
                return isWithinInterval(date, { start, end });
            });
        };
    }, [blocks]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                    <span>Unavailable</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {months.map((month) => (
                    <MonthCalendar
                        key={month.toISOString()}
                        month={month}
                        isBlocked={isBlocked}
                    />
                ))}
            </div>
        </div>
    );
}

function MonthCalendar({
    month,
    isBlocked,
}: {
    month: Date;
    isBlocked: (date: Date) => boolean;
}) {
    const days = eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
    });

    const startDay = getDay(startOfMonth(month));

    return (
        <div>
            <h4 className="font-display font-semibold text-center mb-3">
                {format(month, "MMMM yyyy")}
            </h4>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="font-medium text-muted-foreground py-1">
                        {day}
                    </div>
                ))}
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                    const blocked = isBlocked(day);
                    return (
                        <div
                            key={day.toISOString()}
                            className={`py-1.5 rounded text-xs ${blocked
                                    ? "bg-red-100 text-red-700 font-medium"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                        >
                            {format(day, "d")}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
