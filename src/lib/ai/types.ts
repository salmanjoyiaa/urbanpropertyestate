import type { Property } from "@/lib/types";

// ============================================
// AI Listing Copilot
// ============================================
export type ListingTone = "premium" | "family" | "student";
export type MarketRegion = "gcc" | "eu" | "custom";

export interface CopilotRequest {
    bulletPoints: string;
    tone: ListingTone;
    languages: string[];
    propertyData?: {
        type?: string;
        beds?: number;
        baths?: number;
        rent?: number;
        currency?: string;
        city?: string;
        area?: string;
        amenities?: string[];
        furnished?: boolean;
    };
}

export interface CopilotResponse {
    title: string;
    description: string;
    translations: Record<string, { title: string; description: string }>;
}

// ============================================
// Conversational Property Match
// ============================================
export interface SearchRequest {
    query: string;
    locale?: string;
}

export interface ExtractedFilters {
    city?: string;
    area?: string;
    type?: string;
    minRent?: number;
    maxRent?: number;
    beds?: number;
    baths?: number;
    furnished?: boolean;
    amenities?: string[];
    moveInDate?: string;
    currency?: string;
}

export interface MatchedProperty {
    property: Property;
    matchScore: number;
    matchReasons: string[];
}

export interface SearchResponse {
    results: MatchedProperty[];
    explanation: string;
    extractedFilters: ExtractedFilters;
    originalQuery: string;
}

// ============================================
// AI Listing Summarizer
// ============================================
export type TruthLabel = "confirmed" | "unclear" | "missing";

export interface SummaryField {
    label: string;
    value: string;
    truthLabel: TruthLabel;
    note?: string;
}

export interface ListingSummary {
    fields: SummaryField[];
    redFlags: string[];
    moveInCosts: string;
    overallScore: number; // 1-10 transparency score
}

// ============================================
// Smart WhatsApp Composer
// ============================================
export type MessageIntent =
    | "viewing"
    | "move_in"
    | "documents"
    | "payment"
    | "general";

export interface WhatsAppMessage {
    intent: MessageIntent;
    label: string;
    message: string;
    emoji: string;
}

export interface WhatsAppComposerResponse {
    messages: WhatsAppMessage[];
    propertyContext: string;
}

// ============================================
// AI Pricing & Availability
// ============================================
export interface PricingBand {
    low: number;
    median: number;
    high: number;
    currency: string;
}

export interface PricingRecommendation {
    suggestedRange: PricingBand;
    currentPrice: number;
    pricePosition: "below" | "competitive" | "above" | "premium";
    comparableCount: number;
    seasonalAdjustment: number; // percentage
    confidence: "low" | "medium" | "high";
    insights: string[];
}

// ============================================
// Lead Qualification
// ============================================
export type LeadTemperature = "hot" | "warm" | "cold";

export interface LeadClassification {
    temperature: LeadTemperature;
    score: number; // 0-100
    reasons: string[];
    suggestedFollowUp: string;
    followUpDelay: number; // minutes
}

// ============================================
// Fraud Detection
// ============================================
export interface FraudFlag {
    type: "pricing" | "photos" | "description" | "account";
    severity: "low" | "medium" | "high";
    description: string;
}

export interface FraudAnalysis {
    riskScore: number; // 0-100
    flags: FraudFlag[];
    recommendation: "approve" | "review" | "reject";
}

// ============================================
// Compliance
// ============================================
export interface ComplianceCheck {
    passed: boolean;
    violations: ComplianceViolation[];
}

export interface ComplianceViolation {
    type: "fair_housing" | "discrimination" | "privacy" | "misleading";
    severity: "warning" | "critical";
    text: string;
    suggestion: string;
    regulation: string;
}

// ============================================
// AI Audit Log
// ============================================
export interface AuditLogEntry {
    feature: string;
    input: string;
    output: string;
    model: string;
    userId?: string;
    propertyId?: string;
    complianceResult?: ComplianceCheck;
    createdAt: string;
}
