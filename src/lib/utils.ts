import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD") {
    const localeMap: Record<string, string> = {
        USD: "en-US",
        PKR: "en-PK",
        EUR: "en-DE",
        GBP: "en-GB",
        AED: "en-AE",
        SAR: "en-SA",
    };
    return new Intl.NumberFormat(localeMap[currency] || "en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export const CURRENCY_OPTIONS = [
    { value: "USD", label: "USD ($)", symbol: "$" },
    { value: "PKR", label: "PKR (₨)", symbol: "₨" },
    { value: "EUR", label: "EUR (€)", symbol: "€" },
    { value: "GBP", label: "GBP (£)", symbol: "£" },
    { value: "AED", label: "AED (د.إ)", symbol: "د.إ" },
    { value: "SAR", label: "SAR (﷼)", symbol: "﷼" },
];

export function buildWhatsAppUrl(
    whatsappNumber: string,
    agentName: string,
    propertyTitle: string,
    propertyUrl: string
) {
    const message = `Hi ${agentName}, I'm interested in ${propertyTitle}. Link: ${propertyUrl}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function getPropertyTypeLabel(type: string) {
    const labels: Record<string, string> = {
        apartment: "Apartment",
        house: "House",
        flat: "Flat",
    };
    return labels[type] || type;
}

export function getStatusColor(status: string) {
    return status === "published"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-amber-100 text-amber-800";
}
