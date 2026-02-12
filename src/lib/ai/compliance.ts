import { generateJSON } from "./groq";
import { COMPLIANCE_SYSTEM_PROMPT, getCompliancePrompt } from "./prompts";
import type { ComplianceCheck } from "./types";

// Banned words/phrases for quick pre-screening (before hitting AI)
const BANNED_PATTERNS: Array<{ pattern: RegExp; regulation: string; suggestion: string }> = [
    // Race/ethnicity
    { pattern: /\b(white|black|asian|hispanic|latino|caucasian)\s*(only|preferred|neighborhood|area|community)\b/gi, regulation: "US Fair Housing Act - Race", suggestion: "Remove racial references" },
    // Religion
    { pattern: /\b(christian|muslim|jewish|hindu|buddhist)\s*(only|preferred|neighborhood|community)\b/gi, regulation: "US Fair Housing Act - Religion", suggestion: "Remove religious references" },
    // Familial status
    { pattern: /\b(no\s*(kids|children|families)|adults?\s*only|couples?\s*only|singles?\s*only)\b/gi, regulation: "US Fair Housing Act - Familial Status", suggestion: "Remove familial status restrictions. Use 'occupancy limits' based on property size instead" },
    // Sex/Gender
    { pattern: /\b(males?\s*only|females?\s*only|men\s*only|women\s*only)\b/gi, regulation: "US Fair Housing Act - Sex", suggestion: "Remove gender restrictions" },
    // Disability
    { pattern: /\b(no\s*(disabled|handicapped|wheelchair)|able[- ]bodied\s*only)\b/gi, regulation: "US Fair Housing Act - Disability", suggestion: "Remove disability-related restrictions. Describe accessibility features instead" },
    // National origin
    { pattern: /\b(no\s*(foreigners|immigrants)|citizens?\s*only|nationals?\s*only)\b/gi, regulation: "US Fair Housing Act - National Origin", suggestion: "Remove national origin restrictions" },
    // Age (EU)
    { pattern: /\b(no\s*(elderly|seniors|old people|young people)|age\s*\d+\s*(and\s*)?(over|under|only))\b/gi, regulation: "EU Anti-Discrimination - Age", suggestion: "Remove age-based restrictions" },
];

/**
 * Quick pre-screen using regex patterns (no AI call needed)
 */
export function quickComplianceCheck(text: string): ComplianceCheck {
    const violations = [];

    for (const { pattern, regulation, suggestion } of BANNED_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                violations.push({
                    type: "fair_housing" as const,
                    severity: "critical" as const,
                    text: match,
                    suggestion,
                    regulation,
                });
            }
        }
    }

    return {
        passed: violations.length === 0,
        violations,
    };
}

/**
 * Full AI-powered compliance check (for more nuanced analysis)
 */
export async function fullComplianceCheck(text: string): Promise<ComplianceCheck> {
    // First do quick pattern check
    const quickResult = quickComplianceCheck(text);

    // If quick check already found critical violations, return immediately
    if (quickResult.violations.some(v => v.severity === "critical")) {
        return quickResult;
    }

    // Use AI for nuanced analysis
    try {
        const aiResult = await generateJSON<ComplianceCheck>(
            getCompliancePrompt(text),
            {
                systemPrompt: COMPLIANCE_SYSTEM_PROMPT,
                temperature: 0.2,
                model: "FAST",
            }
        );

        // Merge results
        return {
            passed: quickResult.passed && (aiResult.passed ?? true),
            violations: [
                ...quickResult.violations,
                ...(aiResult.violations || []),
            ],
        };
    } catch {
        // If AI call fails, return the quick check result
        return quickResult;
    }
}

/**
 * Sanitize text by removing/replacing flagged content
 */
export function sanitizeListingText(text: string): { sanitized: string; changesApplied: string[] } {
    let sanitized = text;
    const changesApplied: string[] = [];

    for (const { pattern, suggestion } of BANNED_PATTERNS) {
        const matches = sanitized.match(pattern);
        if (matches) {
            for (const match of matches) {
                sanitized = sanitized.replace(match, "");
                changesApplied.push(`Removed "${match}" — ${suggestion}`);
            }
        }
    }

    // Clean up double spaces/punctuation left by removals
    sanitized = sanitized.replace(/\s{2,}/g, " ").trim();

    return { sanitized, changesApplied };
}
