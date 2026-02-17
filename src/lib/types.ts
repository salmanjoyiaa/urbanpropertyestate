export type UserRole = "customer" | "agent" | "admin";

export interface Profile {
    id: string;
    name: string;
    phone: string;
    whatsapp_number: string;
    photo_url: string | null;
    bio: string | null;
    service_areas: string[];
    is_public: boolean;
    role: UserRole;
    created_at: string;
    updated_at: string;
}

export interface Property {
    id: string;
    agent_id: string;
    title: string;
    type: "apartment" | "house" | "flat";
    rent: number;
    deposit: number;
    currency: string;
    city: string;
    area: string;
    street_address: string;
    beds: number;
    baths: number;
    size_sqft: number | null;
    furnished: boolean;
    amenities: string[];
    description: string;
    status: "draft" | "published";
    created_at: string;
    updated_at: string;
    // Joined data
    agent?: Profile;
    property_photos?: PropertyPhoto[];
    property_blocks?: PropertyBlock[];
}

export interface PropertyPhoto {
    id: string;
    property_id: string;
    url: string;
    position: number;
    is_cover: boolean;
    created_at: string;
}

export interface PropertyBlock {
    id: string;
    property_id: string;
    start_date: string;
    end_date: string;
    note: string | null;
    created_at: string;
}

export interface PropertyFilters {
    city?: string;
    type?: string;
    minRent?: number;
    maxRent?: number;
    beds?: number;
    search?: string;
}

export type HouseholdItemCategory =
    | "furniture"
    | "electronics"
    | "appliances"
    | "kitchen"
    | "bedroom"
    | "bathroom"
    | "decor"
    | "lighting"
    | "storage"
    | "outdoor"
    | "kids"
    | "other";

export type ItemCondition = "like_new" | "good" | "fair" | "used";

export interface HouseholdItem {
    id: string;
    seller_id: string;
    title: string;
    category: HouseholdItemCategory;
    price: number;
    currency: string;
    condition: ItemCondition;
    description: string;
    city: string;
    area: string;
    delivery_available: boolean;
    is_negotiable: boolean;
    status: "available" | "reserved" | "sold" | "removed";
    created_at: string;
    updated_at: string;
    // Joined data
    seller?: Profile;
    household_item_photos?: HouseholdItemPhoto[];
}

export interface HouseholdItemPhoto {
    id: string;
    item_id: string;
    url: string;
    position: number;
    is_cover: boolean;
    created_at: string;
}

// ============ Visit Scheduling Types ============

export interface AvailabilitySlot {
    id: string;
    property_id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    is_available: boolean;
    created_at: string;
    updated_at: string;
    // Joined
    property?: Property;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
    id: string;
    property_id: string;
    slot_id: string;
    customer_name: string;
    customer_phone: string;
    customer_nationality: string | null;
    customer_email: string | null;
    status: BookingStatus;
    idempotency_key: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    property?: Property;
    availability_slot?: AvailabilitySlot;
}

export interface AuditLog {
    id: string;
    actor_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    // Joined
    actor?: Profile;
}
