export interface Profile {
    id: string;
    name: string;
    phone: string;
    whatsapp_number: string;
    photo_url: string | null;
    bio: string | null;
    service_areas: string[];
    is_public: boolean;
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
