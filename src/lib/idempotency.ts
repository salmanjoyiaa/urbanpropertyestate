import { createHash } from "crypto";

export function generateIdempotencyKey(
    propertyId: string,
    slotId: string,
    customerPhone: string,
    ip: string
): string {
    // Create a deterministic key from the booking parameters.
    // Same inputs always produce the same key, so client retries are
    // correctly deduplicated via the DB UNIQUE constraint.
    const raw = `${propertyId}:${slotId}:${customerPhone}:${ip}`;
    const hash = createHash("sha256").update(raw).digest("hex").slice(0, 32);
    return `bk_${hash}`;
}
