export function validateName(name: string): string | null {
    if (!name || name.trim().length === 0) {
        return "Name is required";
    }
    if (name.trim().length < 2) {
        return "Name must be at least 2 characters";
    }
    if (name.trim().length > 100) {
        return "Name must be less than 100 characters";
    }
    // Only allow letters, spaces, hyphens, apostrophes, periods
    if (!/^[a-zA-Z\s'\-\.]+$/.test(name.trim())) {
        return "Name contains invalid characters";
    }
    return null;
}

export function validatePhoneNumber(phone: string): string | null {
    if (!phone || phone.trim().length === 0) {
        return "Phone number is required";
    }
    // Strip whitespace, dashes, parentheses for validation
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    if (cleaned.length < 7 || cleaned.length > 20) {
        return "Phone number must be between 7 and 20 digits";
    }
    // Must start with + or digit, then only digits
    if (!/^\+?\d+$/.test(cleaned)) {
        return "Invalid phone number format";
    }
    return null;
}

export function normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, "").trim();
}

export function validateEmail(email: string): string | null {
    if (!email || email.trim().length === 0) {
        return null; // Email is optional
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return "Invalid email format";
    }
    if (email.trim().length > 254) {
        return "Email is too long";
    }
    return null;
}

export function validateUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function sanitizeText(input: string, maxLength: number = 500): string {
    if (!input || typeof input !== "string") return "";
    return input
        .slice(0, maxLength)
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]*>/g, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim();
}
