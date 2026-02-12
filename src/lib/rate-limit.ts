// Simple in-memory rate limiter for API routes
// For production, use Redis-based rate limiting

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        rateLimitStore.forEach((entry, key) => {
            if (entry.resetAt < now) rateLimitStore.delete(key);
        });
    }, 5 * 60 * 1000);
}

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

export function checkRateLimit(
    clientIp: string,
    config: RateLimitConfig
): RateLimitResult {
    const key = `${config.identifier || "default"}:${clientIp}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
        // New window
        rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
        return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
    }

    if (entry.count >= config.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
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
