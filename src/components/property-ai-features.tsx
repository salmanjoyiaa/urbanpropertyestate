"use client";

import ListingSummaryCard from "@/components/listing-summary-card";
import SmartWhatsAppComposer from "@/components/smart-whatsapp-composer";

interface PropertyAIFeaturesProps {
    description: string;
    price: number;
    currency: string;
    propertyId: string;
    propertyTitle: string;
    agentName: string;
    whatsappNumber: string;
    propertyDetails?: Record<string, unknown>;
}

export default function PropertyAIFeatures({
    description,
    price,
    currency,
    propertyId,
    propertyTitle,
    agentName,
    whatsappNumber,
    propertyDetails,
}: PropertyAIFeaturesProps) {
    return (
        <div className="space-y-4">
            {/* Smart WhatsApp Composer */}
            <SmartWhatsAppComposer
                whatsappNumber={whatsappNumber}
                agentName={agentName}
                propertyTitle={propertyTitle}
                propertyId={propertyId}
                propertyDetails={propertyDetails}
            />

            {/* AI Listing Summary */}
            <ListingSummaryCard
                description={description}
                price={price}
                currency={currency}
            />
        </div>
    );
}
