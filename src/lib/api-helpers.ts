import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, AI_RATE_LIMITS, type RateLimitConfig } from "@/lib/rate-limit";

/**
 * Verify the request is authenticated (for agent-only routes).
 * Returns the user or a 401 response.
 */
export async function requireAuth() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { user: null, error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
        }
        return { user, error: null };
    } catch {
        return { user: null, error: NextResponse.json({ error: "Authentication failed" }, { status: 401 }) };
    }
}

/**
 * Apply rate limiting. Returns null if allowed, or a 429 response.
 */
export async function applyRateLimit(request: NextRequest, configKey: keyof typeof AI_RATE_LIMITS) {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const config = AI_RATE_LIMITS[configKey] || AI_RATE_LIMITS.general;
    const result = await checkRateLimit(clientIp, config);

    if (!result.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
                    "X-RateLimit-Remaining": "0",
                },
            }
        );
    }
    return null;
}
