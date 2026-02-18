"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUUID, sanitizeText } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { HouseholdItemCategory, ItemCondition } from "@/lib/types";

const VALID_CATEGORIES: HouseholdItemCategory[] = [
    "furniture", "electronics", "appliances", "kitchen",
    "bedroom", "bathroom", "decor", "lighting",
    "storage", "outdoor", "kids", "other",
];

const VALID_CONDITIONS: ItemCondition[] = ["like_new", "good", "fair", "used"];

async function requireAgentOrAdmin() {
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

    if (!profile || !["agent", "admin"].includes(profile.role)) {
        throw new Error("Forbidden: Agent or admin access required");
    }

    return { user, role: profile.role };
}

interface CreateMarketplaceItemInput {
    title: string;
    category: string;
    price: number;
    currency?: string;
    condition: string;
    description?: string;
    city: string;
    area: string;
    deliveryAvailable?: boolean;
    isNegotiable?: boolean;
}

export async function createMarketplaceItem(input: CreateMarketplaceItemInput) {
    try {
        const { user } = await requireAgentOrAdmin();
        const adminClient = createAdminClient();

        if (!input.title || input.title.trim().length < 3) {
            return { success: false, error: "Title must be at least 3 characters" };
        }

        if (!VALID_CATEGORIES.includes(input.category as HouseholdItemCategory)) {
            return { success: false, error: "Invalid category" };
        }

        if (!VALID_CONDITIONS.includes(input.condition as ItemCondition)) {
            return { success: false, error: "Invalid condition" };
        }

        if (!input.price || input.price < 0) {
            return { success: false, error: "Price must be a positive number" };
        }

        if (!input.city || input.city.trim().length < 2) {
            return { success: false, error: "City is required" };
        }

        if (!input.area || input.area.trim().length < 2) {
            return { success: false, error: "Area is required" };
        }

        const { data, error } = await adminClient
            .from("household_items")
            .insert({
                seller_id: user.id,
                agent_id: user.id,
                title: sanitizeText(input.title.trim(), 200),
                category: input.category,
                price: Math.round(input.price),
                currency: input.currency || "USD",
                condition: input.condition,
                description: input.description ? sanitizeText(input.description, 2000) : "",
                city: sanitizeText(input.city.trim(), 100),
                area: sanitizeText(input.area.trim(), 100),
                delivery_available: input.deliveryAvailable || false,
                is_negotiable: input.isNegotiable !== false,
                status: "available",
            })
            .select("id")
            .single();

        if (error) throw error;

        await logAudit(user.id, "marketplace_item_created", "household_items", data.id, {
            title: input.title,
            category: input.category,
        });

        revalidatePath("/dashboard/agent/marketplace");
        revalidatePath("/marketplace");
        return { success: true, itemId: data.id };
    } catch (error) {
        console.error("Create marketplace item error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create item",
        };
    }
}

interface UpdateMarketplaceItemInput {
    itemId: string;
    title?: string;
    category?: string;
    price?: number;
    currency?: string;
    condition?: string;
    description?: string;
    city?: string;
    area?: string;
    deliveryAvailable?: boolean;
    isNegotiable?: boolean;
    status?: "available" | "reserved" | "sold" | "removed";
}

export async function updateMarketplaceItem(input: UpdateMarketplaceItemInput) {
    try {
        if (!validateUUID(input.itemId)) {
            return { success: false, error: "Invalid item ID" };
        }

        const { user, role } = await requireAgentOrAdmin();
        const adminClient = createAdminClient();

        // Verify ownership (unless admin)
        const { data: item, error: fetchError } = await adminClient
            .from("household_items")
            .select("id, agent_id")
            .eq("id", input.itemId)
            .single();

        if (fetchError || !item) {
            return { success: false, error: "Item not found" };
        }

        if (role !== "admin" && item.agent_id !== user.id) {
            return { success: false, error: "You can only edit your own items" };
        }

        // Build update payload
        const payload: Record<string, unknown> = {};

        if (input.title !== undefined) {
            if (input.title.trim().length < 3) {
                return { success: false, error: "Title must be at least 3 characters" };
            }
            payload.title = sanitizeText(input.title.trim(), 200);
        }

        if (input.category !== undefined) {
            if (!VALID_CATEGORIES.includes(input.category as HouseholdItemCategory)) {
                return { success: false, error: "Invalid category" };
            }
            payload.category = input.category;
        }

        if (input.condition !== undefined) {
            if (!VALID_CONDITIONS.includes(input.condition as ItemCondition)) {
                return { success: false, error: "Invalid condition" };
            }
            payload.condition = input.condition;
        }

        if (input.price !== undefined) {
            if (input.price < 0) return { success: false, error: "Price must be positive" };
            payload.price = Math.round(input.price);
        }

        if (input.currency !== undefined) payload.currency = input.currency;
        if (input.description !== undefined) payload.description = sanitizeText(input.description, 2000);
        if (input.city !== undefined) payload.city = sanitizeText(input.city.trim(), 100);
        if (input.area !== undefined) payload.area = sanitizeText(input.area.trim(), 100);
        if (input.deliveryAvailable !== undefined) payload.delivery_available = input.deliveryAvailable;
        if (input.isNegotiable !== undefined) payload.is_negotiable = input.isNegotiable;
        if (input.status !== undefined) payload.status = input.status;

        if (Object.keys(payload).length === 0) {
            return { success: false, error: "No changes provided" };
        }

        const { error } = await adminClient
            .from("household_items")
            .update(payload)
            .eq("id", input.itemId);

        if (error) throw error;

        await logAudit(user.id, "marketplace_item_updated", "household_items", input.itemId, {
            updated_fields: Object.keys(payload),
        });

        revalidatePath("/dashboard/agent/marketplace");
        revalidatePath("/marketplace");
        return { success: true };
    } catch (error) {
        console.error("Update marketplace item error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update item",
        };
    }
}

export async function deleteMarketplaceItem(itemId: string) {
    try {
        if (!validateUUID(itemId)) {
            return { success: false, error: "Invalid item ID" };
        }

        const { user, role } = await requireAgentOrAdmin();
        const adminClient = createAdminClient();

        // Verify ownership (unless admin)
        const { data: item, error: fetchError } = await adminClient
            .from("household_items")
            .select("id, agent_id, title")
            .eq("id", itemId)
            .single();

        if (fetchError || !item) {
            return { success: false, error: "Item not found" };
        }

        if (role !== "admin" && item.agent_id !== user.id) {
            return { success: false, error: "You can only delete your own items" };
        }

        const { error } = await adminClient
            .from("household_items")
            .delete()
            .eq("id", itemId);

        if (error) throw error;

        await logAudit(user.id, "marketplace_item_deleted", "household_items", itemId, {
            title: item.title,
        });

        revalidatePath("/dashboard/agent/marketplace");
        revalidatePath("/marketplace");
        return { success: true };
    } catch (error) {
        console.error("Delete marketplace item error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete item",
        };
    }
}

export async function getAgentMarketplaceItems() {
    try {
        const { user } = await requireAgentOrAdmin();
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from("household_items")
            .select("*, household_item_photos(*)")
            .eq("agent_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return { success: true, items: data || [] };
    } catch (error) {
        console.error("Get agent marketplace items error:", error);
        return {
            success: false,
            items: [],
            error: error instanceof Error ? error.message : "Failed to fetch items",
        };
    }
}
