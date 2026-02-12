import Link from "next/link";
import Image from "next/image";
import { BedDouble, Bath, MapPin, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getPropertyTypeLabel } from "@/lib/utils";
import type { Property } from "@/lib/types";

interface PropertyCardProps {
    property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
    const coverPhoto = property.property_photos?.find((p) => p.is_cover) ||
        property.property_photos?.[0];

    return (
        <Link href={`/properties/${property.id}`}>
            <Card className="group overflow-hidden hover:shadow-xl card-glow transition-all duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {coverPhoto ? (
                        <Image
                            src={coverPhoto.url}
                            alt={property.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Building2 className="h-12 w-12 opacity-30" />
                        </div>
                    )}
                    {/* Type badge */}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-foreground backdrop-blur-sm">
                        {getPropertyTypeLabel(property.type)}
                    </Badge>
                    {/* Price tag */}
                    <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                        {formatCurrency(property.rent, property.currency)}/mo
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {property.title}
                    </h3>

                    <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
                        <span className="line-clamp-1">
                            {property.area}, {property.city}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <BedDouble className="h-4 w-4 mr-1" />
                            {property.beds} bed
                        </div>
                        <div className="flex items-center">
                            <Bath className="h-4 w-4 mr-1" />
                            {property.baths} bath
                        </div>
                        {property.size_sqft && (
                            <div className="text-xs">{property.size_sqft} sqft</div>
                        )}
                    </div>

                    {/* Agent */}
                    {property.agent && (
                        <div className="flex items-center pt-2 border-t text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5 mr-1" />
                            {property.agent.name}
                        </div>
                    )}
                </div>
            </Card>
        </Link>
    );
}

function Building2(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    );
}
