"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUUID } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { sendVisitApprovedEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/types";

async function requireAdminRole() {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        throw new Error("Forbidden: Admin access required");
    }

    return user;
}

export async function updateUserRole(userId: string, newRole: UserRole) {
    try {
        if (!validateUUID(userId)) {
            return { success: false, error: "Invalid user ID" };
        }

        const admin = await requireAdminRole();
        const adminClient = createAdminClient();

        const { error } = await adminClient
            .from("profiles")
            .update({ role: newRole })
            .eq("id", userId);

        if (error) throw error;

        await logAudit(admin.id, "role_changed", "profiles", userId, {
            new_role: newRole,
        });

        revalidatePath("/dashboard/admin");
        return { success: true };
    } catch (error) {
        console.error("Update role error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update role",
        };
    }
}

export async function adminUpdateBookingStatus(
    bookingId: string,
    status: "confirmed" | "cancelled" | "completed"
) {
    try {
        if (!validateUUID(bookingId)) {
            return { success: false, error: "Invalid booking ID" };
        }

        const admin = await requireAdminRole();
        const adminClient = createAdminClient();

        const { data: booking, error: bookingError } = await adminClient
            .from("bookings")
            .select("id, property_id, customer_name, customer_phone, customer_email, customer_nationality, slot_id")
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) {
            return { success: false, error: "Booking not found" };
        }

        const { data: property } = await adminClient
            .from("properties")
            .select("title, agent_id")
            .eq("id", booking.property_id)
            .single();

        const { data: slot } = await adminClient
            .from("availability_slots")
            .select("slot_date, start_time, end_time")
            .eq("id", booking.slot_id)
            .single();

        const { error } = await adminClient
            .from("bookings")
            .update({ status })
            .eq("id", bookingId);

        if (error) throw error;

        await logAudit(admin.id, `admin_booking_${status}`, "bookings", bookingId, {
            property_id: booking.property_id,
        });

        if (status === "confirmed" && property?.agent_id) {
            await adminClient.from("leads").insert({
                property_id: booking.property_id,
                agent_id: property.agent_id,
                contact_name: booking.customer_name,
                contact_phone: booking.customer_phone,
                contact_email: booking.customer_email,
                message: `Approved visit request for ${property.title || "property"}.`,
                source: "visit_approved",
                temperature: "warm",
                score: 60,
                status: "new",
                notes: booking.customer_nationality || null,
            });

            await sendVisitApprovedEmail({
                customerEmail: booking.customer_email,
                customerName: booking.customer_name,
                propertyTitle: property.title || "Property",
                requestedDate: slot?.slot_date || null,
                requestedTime: slot ? `${slot.start_time} - ${slot.end_time}` : null,
            });
        }

        revalidatePath("/dashboard/admin/bookings");
        revalidatePath("/dashboard/leads");
        return { success: true };
    } catch (error) {
        console.error("Admin booking update error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update booking",
        };
    }
}

export async function adminDeleteProperty(propertyId: string) {
    try {
        if (!validateUUID(propertyId)) {
            return { success: false, error: "Invalid property ID" };
        }

        const admin = await requireAdminRole();
        const adminClient = createAdminClient();

        const { error } = await adminClient
            .from("properties")
            .delete()
            .eq("id", propertyId);

        if (error) throw error;

        await logAudit(admin.id, "admin_property_deleted", "properties", propertyId, {});

        revalidatePath("/dashboard/admin/properties");
        return { success: true };
    } catch (error) {
        console.error("Admin delete property error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete property",
        };
    }
}
