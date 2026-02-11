"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/utils";

interface WhatsAppButtonProps {
    whatsappNumber: string;
    agentName: string;
    propertyTitle: string;
    propertyId: string;
    size?: "default" | "lg" | "xl";
    className?: string;
}

export default function WhatsAppButton({
    whatsappNumber,
    agentName,
    propertyTitle,
    propertyId,
    size = "lg",
    className,
}: WhatsAppButtonProps) {
    const propertyUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/properties/${propertyId}`
            : `/properties/${propertyId}`;

    const whatsappUrl = buildWhatsAppUrl(
        whatsappNumber,
        agentName,
        propertyTitle,
        propertyUrl
    );

    return (
        <Button
            variant="whatsapp"
            size={size}
            className={className}
            asChild
        >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Book on WhatsApp
            </a>
        </Button>
    );
}
