import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Tag, Truck, MessageCircle, Phone, UserX } from "lucide-react";
import type { HouseholdItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
    like_new: { label: "Like New", color: "bg-emerald-100 text-emerald-700" },
    good: { label: "Good", color: "bg-blue-100 text-blue-700" },
    fair: { label: "Fair", color: "bg-amber-100 text-amber-700" },
    used: { label: "Used", color: "bg-gray-100 text-gray-700" },
};

const CATEGORY_EMOJI: Record<string, string> = {
    furniture: "🛋️",
    electronics: "📺",
    appliances: "🔌",
    kitchen: "🍳",
    bedroom: "🛏️",
    bathroom: "🚿",
    decor: "🖼️",
    lighting: "💡",
    storage: "📦",
    outdoor: "☀️",
    kids: "🧸",
    other: "📎",
};

interface HouseholdItemCardProps {
    item: HouseholdItem;
}

export default function HouseholdItemCard({ item }: HouseholdItemCardProps) {
    const coverPhoto = item.household_item_photos?.find((p) => p.is_cover) || item.household_item_photos?.[0];
    const conditionInfo = CONDITION_LABELS[item.condition] || CONDITION_LABELS.good;
    const categoryEmoji = CATEGORY_EMOJI[item.category] || "📎";

    const whatsappNumber = item.seller?.whatsapp_number || "";
    const whatsappMessage = encodeURIComponent(
        `Hi, I'm interested in your "${item.title}" listed for ${formatCurrency(item.price, item.currency)} on UrbanEstate. Is it still available?`
    );

    return (
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {coverPhoto ? (
                    <Image
                        src={coverPhoto.url}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                        {categoryEmoji}
                    </div>
                )}

                {/* Condition badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionInfo.color}`}>
                        {conditionInfo.label}
                    </span>
                </div>

                {/* Negotiable badge */}
                {item.is_negotiable && (
                    <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            Negotiable
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                    </h3>
                    <span className="text-lg font-bold text-primary whitespace-nowrap">
                        {formatCurrency(item.price, item.currency)}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {categoryEmoji} {item.category}
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.area}, {item.city}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {item.delivery_available && (
                        <Badge variant="secondary" className="text-xs gap-1">
                            <Truck className="h-3 w-3" />
                            Delivery
                        </Badge>
                    )}
                </div>

                {/* Contact CTA — always visible */}
                {whatsappNumber ? (
                    <a
                        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full mt-2 py-2 rounded-lg bg-[#25d366] text-white text-sm font-medium hover:bg-[#20bd5a] transition-colors"
                    >
                        <MessageCircle className="h-4 w-4" />
                        Chat on WhatsApp
                    </a>
                ) : item.seller?.phone ? (
                    <a
                        href={`tel:${item.seller.phone}`}
                        className="flex items-center justify-center gap-2 w-full mt-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Phone className="h-4 w-4" />
                        Call Seller
                    </a>
                ) : (
                    <div className="flex items-center justify-center gap-2 w-full mt-2 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium cursor-not-allowed">
                        <UserX className="h-4 w-4" />
                        Contact Unavailable
                    </div>
                )}
            </div>
        </Card>
    );
}
