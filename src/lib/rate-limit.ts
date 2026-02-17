// Serverless-safe rate limiter backed by Supabase RPC (atomic DB counters).
// The `check_rate_limit` RPC uses SELECT ... FOR UPDATE to prevent race
// conditions across concurrent requests, and state persists between cold starts.

import { createClient } from "@/lib/supabase/server";

export interface RateLimitConfig {
    maxRequests: number;      // Max requests per window
    windowMs: number;         // Window size in milliseconds
    identifier?: string;      // Custom identifier (e.g., "ai-copilot")
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Atomic, serverless-safe rate limit check via Supabase RPC.
 * Falls back to allowing the request if the DB call fails
 * (fail-open to avoid blocking legitimate traffic).
 */
export async function checkRateLimit(
    clientIp: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const windowSeconds = Math.ceil(config.windowMs / 1000);
    const identifier = `${config.identifier || "default"}:${clientIp}`;

    try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("check_rate_limit", {
            p_identifier: identifier,
            p_action: config.identifier || "default",
            p_max_requests: config.maxRequests,
            p_window_seconds: windowSeconds,
        });

        if (error) {
            console.error("Rate limit RPC error:", error);
            // Fail open — don't block legitimate users if DB is unreachable
            return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowMs };
        }

        const allowed = data === true;
        return {
            allowed,
            remaining: allowed ? Math.max(0, config.maxRequests - 1) : 0,
            resetAt: Date.now() + config.windowMs,
        };
    } catch (err) {
        console.error("Rate limit error:", err);
        return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowMs };
    }
}

// Sanitize user input to prevent XSS and injection
export function sanitizeInput(input: string, maxLength: number = 2000): string {
    if (!input || typeof input !== "string") return "";

    return input
        .slice(0, maxLength)
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")  // Remove script tags
        .replace(/<[^>]*>/g, "")                                 // Remove HTML tags
        .replace(/javascript:/gi, "")                            // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, "")                            // Remove event handlers
        .trim();
}

// Pre-configured rate limits for different endpoints
export const AI_RATE_LIMITS: Record<string, RateLimitConfig> = {
    receptionist: { maxRequests: 20, windowMs: 60_000, identifier: "ai-receptionist" },
    copilot: { maxRequests: 10, windowMs: 60_000, identifier: "ai-copilot" },
    search: { maxRequests: 15, windowMs: 60_000, identifier: "ai-search" },
    leads: { maxRequests: 10, windowMs: 60_000, identifier: "leads" },
    general: { maxRequests: 30, windowMs: 60_000, identifier: "general" },
};
