"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    validateName,
    validatePhoneNumber,
    validateEmail,
    normalizePhone,
    sanitizeText,
    validateUUID,
} from "@/lib/validation";
import { generateIdempotencyKey } from "@/lib/idempotency";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import {
    sendAdminNewMarketplaceRequestEmail,
    sendMarketplaceApprovedEmail,
    sendMarketplaceReceivedEmail,
} from "@/lib/email";

interface CreateMarketplaceRequestInput {
    itemId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerNote?: string;
    honeypot?: string;
    idempotencyKey?: string;
}

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

export async function createMarketplaceRequest(input: CreateMarketplaceRequestInput) {
    try {
        if (input.honeypot) {
            return { success: false, error: "Invalid submission" };
        }

        if (!validateUUID(input.itemId)) {
            return { success: false, error: "Invalid item" };
        }

        const nameError = validateName(input.customerName);
        if (nameError) return { success: false, error: nameError };

        const phoneError = validatePhoneNumber(input.customerPhone);
        if (phoneError) return { success: false, error: phoneError };

        if (!input.customerEmail) {
            return { success: false, error: "Email is required" };
        }
        const emailError = validateEmail(input.customerEmail);
        if (emailError) return { success: false, error: emailError };

        const headersList = headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

        const rateLimitResult = await checkRateLimit(ip, {
            maxRequests: 10,
            windowMs: 15 * 60 * 1000,
            identifier: "marketplace_request_create",
        });

        if (!rateLimitResult.allowed) {
            return {
                success: false,
                error: "Too many requests. Please try again later.",
            };
        }

        // Use admin client to bypass RLS for public marketplace submissions
        const supabase = createAdminClient();

        const { data: item, error: itemError } = await supabase
            .from("household_items")
            .select("id, title, seller_id, agent_id, status")
            .eq("id", input.itemId)
            .single();

        if (itemError || !item || item.status !== "available") {
            return { success: false, error: "This item is no longer available" };
        }

        // Resolve agent_id: prefer explicit agent_id, fallback to seller_id
        const resolvedAgentId = item.agent_id || item.seller_id;

        const idempotencyKey =
            input.idempotencyKey ||
            generateIdempotencyKey(item.id, resolvedAgentId, normalizePhone(input.customerPhone), ip);

        const { data: existingRequest } = await supabase
            .from("marketplace_requests")
            .select("id")
            .eq("idempotency_key", idempotencyKey)
            .single();

        if (existingRequest) {
            return {
                success: true,
                message: "You will receive a confirmation email once your request is approved.",
                requestId: existingRequest.id,
            };
        }

        const { data: created, error: insertError } = await supabase
            .from("marketplace_requests")
            .insert({
                item_id: item.id,
                seller_id: item.seller_id,
                agent_id: resolvedAgentId,
                customer_name: sanitizeText(input.customerName.trim(), 100),
                customer_phone: normalizePhone(input.customerPhone),
                customer_email: input.customerEmail.trim(),
                customer_note: input.customerNote ? sanitizeText(input.customerNote, 1000) : null,
                status: "pending",
                idempotency_key: idempotencyKey,
            })
            .select("id")
            .single();

        if (insertError) {
            if (insertError.code === "23505") {
                return {
                    success: true,
                    message: "You will receive a confirmation email once your request is approved.",
                };
            }
            throw insertError;
        }

        await logAudit(null, "marketplace_request_created", "marketplace_requests", created.id, {
            item_id: item.id,
            seller_id: item.seller_id,
            agent_id: resolvedAgentId,
            customer_phone: normalizePhone(input.customerPhone),
            ip_address: ip,
        });

        await Promise.allSettled([
            sendMarketplaceReceivedEmail({
                customerEmail: input.customerEmail,
                customerName: input.customerName.trim(),
                itemTitle: item.title,
            }),
            sendAdminNewMarketplaceRequestEmail({
                itemTitle: item.title,
                customerName: input.customerName.trim(),
                customerPhone: normalizePhone(input.customerPhone),
                customerEmail: input.customerEmail,
            }),
        ]);

        return {
            success: true,
            message: "You will receive a confirmation email once your request is approved.",
            requestId: created.id,
        };
    } catch (error) {
        console.error("Create marketplace request error:", error);
        return { success: false, error: "An error occurred. Please try again." };
    }
}

export async function adminUpdateMarketplaceRequestStatus(
    requestId: string,
    status: "approved" | "rejected",
    adminDecisionNote?: string
) {
    try {
        if (!validateUUID(requestId)) {
            return { success: false, error: "Invalid request ID" };
        }

        const admin = await requireAdminRole();
        const adminClient = createAdminClient();

        const { data: request, error: requestError } = await adminClient
            .from("marketplace_requests")
            .select("id, item_id, seller_id, agent_id, customer_name, customer_phone, customer_email")
            .eq("id", requestId)
            .single();

        if (requestError || !request) {
            return { success: false, error: "Request not found" };
        }

        const { data: item } = await adminClient
            .from("household_items")
            .select("title, agent_id")
            .eq("id", request.item_id)
            .single();

        // Resolve agent_id: request.agent_id > item.agent_id > request.seller_id
        const resolvedAgentId = request.agent_id || item?.agent_id || request.seller_id;

        const updatePayload: Record<string, unknown> = {
            status,
            admin_actor_id: admin.id,
            admin_decision_note: adminDecisionNote || null,
        };

        if (status === "approved") {
            updatePayload.approved_at = new Date().toISOString();
        } else {
            updatePayload.rejected_at = new Date().toISOString();
        }

        const { error } = await adminClient
            .from("marketplace_requests")
            .update(updatePayload)
            .eq("id", requestId);

        if (error) throw error;

        await logAudit(admin.id, `marketplace_request_${status}`, "marketplace_requests", requestId, {
            item_id: request.item_id,
            seller_id: request.seller_id,
            agent_id: resolvedAgentId,
        });

        if (status === "approved") {
            await adminClient.from("leads").insert({
                property_id: null,
                agent_id: resolvedAgentId,
                contact_name: request.customer_name,
                contact_phone: request.customer_phone,
                contact_email: request.customer_email,
                message: `Approved marketplace request for ${item?.title || "item"}.`,
                source: "marketplace_approved",
                temperature: "warm",
                score: 60,
                status: "new",
            });

            await sendMarketplaceApprovedEmail({
                customerEmail: request.customer_email,
                customerName: request.customer_name,
                itemTitle: item?.title || "item",
            });
        }

        revalidatePath("/dashboard/admin/leads");
        revalidatePath("/dashboard/leads");
        return { success: true };
    } catch (error) {
        console.error("Admin marketplace request update error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update request",
        };
    }
}
