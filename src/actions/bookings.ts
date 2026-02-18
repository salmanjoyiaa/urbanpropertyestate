"use server";

import { createClient } from "@/lib/supabase/server";
import { validateName, validatePhoneNumber, validateEmail, validateUUID, normalizePhone, sanitizeText } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateIdempotencyKey } from "@/lib/idempotency";
import { logAudit } from "@/lib/audit";
import {
    sendAdminNewVisitRequestEmail,
    sendVisitReceivedEmail,
} from "@/lib/email";
import { headers } from "next/headers";

interface CreateBookingInput {
    propertyId: string;
    slotId: string;
    customerName: string;
    customerPhone: string;
    customerNationality?: string;
    customerEmail?: string;
    honeypot?: string;
    idempotencyKey?: string;
}

export async function createBooking(input: CreateBookingInput) {
    try {
        // 1. Bot detection: honeypot should be empty
        if (input.honeypot) {
            return { success: false, error: "Invalid submission" };
        }

        // 2. Get client IP for rate limiting
        const headersList = headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

        // 3. Rate limiting (5 bookings per 15 minutes per IP)
        const rateLimitResult = await checkRateLimit(ip, {
            maxRequests: 5,
            windowMs: 15 * 60 * 1000,
            identifier: "booking_create",
        });

        if (!rateLimitResult.allowed) {
            return {
                success: false,
                error: "Too many booking attempts. Please try again later.",
            };
        }

        // 4. Input validation
        const nameError = validateName(input.customerName);
        if (nameError) return { success: false, error: nameError };

        const phoneError = validatePhoneNumber(input.customerPhone);
        if (phoneError) return { success: false, error: phoneError };

        if (input.customerEmail) {
            const emailError = validateEmail(input.customerEmail);
            if (emailError) return { success: false, error: emailError };
        }

        if (!validateUUID(input.propertyId) || !validateUUID(input.slotId)) {
            return { success: false, error: "Invalid property or slot" };
        }

        // 5. Generate idempotency key
        const idempotencyKey =
            input.idempotencyKey ||
            generateIdempotencyKey(input.propertyId, input.slotId, input.customerPhone, ip);

        const supabase = createClient();

        // 6. Check idempotency (return existing if duplicate)
        const { data: existingBooking } = await supabase
            .from("bookings")
            .select("id")
            .eq("idempotency_key", idempotencyKey)
            .single();

        if (existingBooking) {
            return {
                success: true,
                message: "Your visit request has already been submitted!",
                bookingId: existingBooking.id,
            };
        }

        // 7. Verify slot is available
        const { data: slot, error: slotError } = await supabase
            .from("availability_slots")
            .select("id, property_id, is_available")
            .eq("id", input.slotId)
            .single();

        if (slotError || !slot || !slot.is_available) {
            return { success: false, error: "This time slot is no longer available" };
        }

        if (slot.property_id !== input.propertyId) {
            return { success: false, error: "Invalid property/slot combination" };
        }

        // 8. Fetch context for notifications
        const { data: property } = await supabase
            .from("properties")
            .select("title")
            .eq("id", input.propertyId)
            .single();

        const { data: slotDetail } = await supabase
            .from("availability_slots")
            .select("slot_date, start_time, end_time")
            .eq("id", input.slotId)
            .single();

        // 9. Create booking atomically
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .insert({
                property_id: input.propertyId,
                slot_id: input.slotId,
                customer_name: sanitizeText(input.customerName.trim(), 100),
                customer_phone: normalizePhone(input.customerPhone),
                customer_nationality: input.customerNationality
                    ? sanitizeText(input.customerNationality.trim(), 100)
                    : null,
                customer_email: input.customerEmail?.trim() || null,
                idempotency_key: idempotencyKey,
                status: "pending",
            })
            .select("id")
            .single();

        if (bookingError) {
            if (bookingError.code === "23505") {
                return {
                    success: false,
                    error: "This slot was just booked. Please select another time.",
                };
            }
            throw bookingError;
        }

        // 10. Log audit
        await logAudit(null, "booking_created", "bookings", booking.id, {
            customer_phone: normalizePhone(input.customerPhone),
            ip_address: ip,
            property_id: input.propertyId,
            slot_id: input.slotId,
        });

        // 11. Email notifications (non-blocking)
        const propertyTitle = property?.title || "Property";
        const requestedTime = slotDetail
            ? `${slotDetail.start_time} - ${slotDetail.end_time}`
            : null;

        await Promise.allSettled([
            sendVisitReceivedEmail({
                customerEmail: input.customerEmail || null,
                customerName: input.customerName.trim(),
                propertyTitle,
            }),
            sendAdminNewVisitRequestEmail({
                propertyTitle,
                customerName: input.customerName.trim(),
                customerPhone: normalizePhone(input.customerPhone),
                customerEmail: input.customerEmail || null,
                requestedDate: slotDetail?.slot_date || null,
                requestedTime,
            }),
        ]);

        return {
            success: true,
            message: "You will receive a confirmation email once your visit is approved.",
            bookingId: booking.id,
        };
    } catch (error) {
        console.error("Booking creation error:", error);
        return {
            success: false,
            error: "An error occurred. Please try again.",
        };
    }
}

export async function updateBookingStatus(
    bookingId: string,
    status: "confirmed" | "cancelled" | "completed"
) {
    try {
        if (!validateUUID(bookingId)) {
            return { success: false, error: "Invalid booking ID" };
        }

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("bookings")
            .update({ status })
            .eq("id", bookingId)
            .select("id, property_id")
            .single();

        if (error) {
            return { success: false, error: "Failed to update booking" };
        }

        await logAudit(user.id, `booking_${status}`, "bookings", bookingId, {
            property_id: data.property_id,
        });

        return { success: true };
    } catch (error) {
        console.error("Booking update error:", error);
        return { success: false, error: "An error occurred" };
    }
}
