"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadCaptureModal from "@/components/lead-capture-modal";

interface InquiryButtonProps {
    propertyTitle: string;
    propertyId: string;
    agentId: string;
    agentName: string;
    agentWhatsapp: string;
    className?: string;
    variant?: "default" | "outline";
    size?: "default" | "sm" | "lg";
}

export default function InquiryButton({
    propertyTitle,
    propertyId,
    agentId,
    agentName,
    agentWhatsapp,
    className = "",
    variant = "outline",
    size = "default",
}: InquiryButtonProps) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={`w-full gap-2 ${className}`}
                onClick={() => setShowModal(true)}
            >
                <MessageSquare className="h-4 w-4" />
                Inquire Now
            </Button>

            <LeadCaptureModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                propertyTitle={propertyTitle}
                propertyId={propertyId}
                agentId={agentId}
                agentName={agentName}
                agentWhatsapp={agentWhatsapp}
            />
        </>
    );
}
