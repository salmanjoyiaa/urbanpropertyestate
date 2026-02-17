"use server";

import { createClient } from "@/lib/supabase/server";
import { validateUUID } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

interface CreateSlotInput {
    propertyId: string;
    slotDate: string;
    startTime: string;
    endTime: string;
    capacity?: number;
}

interface BulkCreateSlotsInput {
    propertyId: string;
    slots: {
        slotDate: string;
        startTime: string;
        endTime: string;
    }[];
}

export async function createAvailabilitySlot(input: CreateSlotInput) {
    try {
        if (!validateUUID(input.propertyId)) {
            return { success: false, error: "Invalid property ID" };
        }

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Validate date is in the future
        const slotDate = new Date(input.slotDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (slotDate < today) {
            return { success: false, error: "Cannot create slots in the past" };
        }

        // Validate time range
        if (input.startTime >= input.endTime) {
            return { success: false, error: "End time must be after start time" };
        }

        const { data, error } = await supabase
            .from("availability_slots")
            .insert({
                property_id: input.propertyId,
                slot_date: input.slotDate,
                start_time: input.startTime,
                end_time: input.endTime,
                capacity: input.capacity || 1,
                is_available: true,
            })
            .select("id")
            .single();

        if (error) {
            if (error.code === "23505") {
                return { success: false, error: "A slot already exists for this date and time" };
            }
            throw error;
        }

        await logAudit(user.id, "slot_created", "availability_slots", data.id, {
            property_id: input.propertyId,
            slot_date: input.slotDate,
            start_time: input.startTime,
            end_time: input.endTime,
        });

        revalidatePath("/dashboard/agent/availability");
        return { success: true, slotId: data.id };
    } catch (error) {
        console.error("Create slot error:", error);
        return { success: false, error: "Failed to create slot" };
    }
}

export async function bulkCreateSlots(input: BulkCreateSlotsInput) {
    try {
        if (!validateUUID(input.propertyId)) {
            return { success: false, error: "Invalid property ID" };
        }

        if (!input.slots.length) {
            return { success: false, error: "No slots provided" };
        }

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const slotsToInsert = input.slots
            .filter((s) => new Date(s.slotDate) >= today && s.startTime < s.endTime)
            .map((s) => ({
                property_id: input.propertyId,
                slot_date: s.slotDate,
                start_time: s.startTime,
                end_time: s.endTime,
                capacity: 1,
                is_available: true,
            }));

        if (!slotsToInsert.length) {
            return { success: false, error: "No valid slots to create" };
        }

        const { data, error } = await supabase
            .from("availability_slots")
            .upsert(slotsToInsert, {
                onConflict: "property_id,slot_date,start_time",
                ignoreDuplicates: true,
            })
            .select("id");

        if (error) throw error;

        await logAudit(user.id, "slots_bulk_created", "availability_slots", null, {
            property_id: input.propertyId,
            count: data?.length || 0,
        });

        revalidatePath("/dashboard/agent/availability");
        return { success: true, count: data?.length || 0 };
    } catch (error) {
        console.error("Bulk create slots error:", error);
        return { success: false, error: "Failed to create slots" };
    }
}

export async function deleteAvailabilitySlot(slotId: string) {
    try {
        if (!validateUUID(slotId)) {
            return { success: false, error: "Invalid slot ID" };
        }

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Check if slot has active bookings
        const { data: bookings } = await supabase
            .from("bookings")
            .select("id")
            .eq("slot_id", slotId)
            .neq("status", "cancelled")
            .limit(1);

        if (bookings && bookings.length > 0) {
            return {
                success: false,
                error: "Cannot delete a slot with active bookings. Cancel the booking first.",
            };
        }

        const { error } = await supabase
            .from("availability_slots")
            .delete()
            .eq("id", slotId);

        if (error) throw error;

        await logAudit(user.id, "slot_deleted", "availability_slots", slotId, {});

        revalidatePath("/dashboard/agent/availability");
        return { success: true };
    } catch (error) {
        console.error("Delete slot error:", error);
        return { success: false, error: "Failed to delete slot" };
    }
}

export async function toggleSlotAvailability(slotId: string, isAvailable: boolean) {
    try {
        if (!validateUUID(slotId)) {
            return { success: false, error: "Invalid slot ID" };
        }

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("availability_slots")
            .update({ is_available: isAvailable })
            .eq("id", slotId);

        if (error) throw error;

        revalidatePath("/dashboard/agent/availability");
        return { success: true };
    } catch (error) {
        console.error("Toggle slot error:", error);
        return { success: false, error: "Failed to update slot" };
    }
}
