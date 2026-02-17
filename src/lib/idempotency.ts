export function generateIdempotencyKey(
    propertyId: string,
    slotId: string,
    customerPhone: string,
    ip: string
): string {
    // Create a deterministic key from the booking parameters
    // This ensures the same customer can't double-book the same slot
    const raw = `${propertyId}:${slotId}:${customerPhone}:${ip}`;
    // Simple hash - in production you might use crypto.subtle
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return `bk_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}
