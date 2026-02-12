import { notFound } from "next/navigation";
import Link from "next/link";
import {
    BedDouble,
    Bath,
    Maximize,
    MapPin,
    Calendar,
    Armchair,
    ArrowLeft,
    User,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PropertyGallery from "@/components/property-gallery";
import WhatsAppButton from "@/components/whatsapp-button";
import AvailabilityCalendar from "@/components/availability-calendar";
import PropertyAIFeatures from "@/components/property-ai-features";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getPropertyTypeLabel } from "@/lib/utils";
import type { Property } from "@/lib/types";

interface Props {
    params: { id: string };
}

export default async function PropertyDetailPage({ params }: Props) {
    let property: Property | null = null;

    try {
        const supabase = createClient();
        const { data } = await supabase
            .from("properties")
            .select(
                "*, agent:profiles(*), property_photos(*), property_blocks(*)"
            )
            .eq("id", params.id)
            .single();
        property = data as Property;
    } catch {
        // Supabase not connected
    }

    if (!property) {
        notFound();
    }

    const agent = property.agent;
    const photos = property.property_photos || [];
    const blocks = property.property_blocks || [];

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="pt-20 pb-32">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back link */}
                    <Button asChild variant="ghost" className="mb-6 -ml-2">
                        <Link href="/properties">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Properties
                        </Link>
                    </Button>

                    {/* Gallery */}
                    <PropertyGallery photos={photos} title={property.title} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Title & Price */}
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <Badge variant="secondary">
                                        {getPropertyTypeLabel(property.type)}
                                    </Badge>
                                    {property.furnished && (
                                        <Badge variant="outline">
                                            <Armchair className="h-3 w-3 mr-1" />
                                            Furnished
                                        </Badge>
                                    )}
                                </div>
                                <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
                                    {property.title}
                                </h1>
                                <div className="flex items-center text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {property.street_address && `${property.street_address}, `}
                                    {property.area}, {property.city}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl font-bold text-primary">
                                    {formatCurrency(property.rent, property.currency)}
                                </span>
                                <span className="text-muted-foreground">/month</span>
                                {property.deposit > 0 && (
                                    <span className="text-sm text-muted-foreground ml-4">
                                        Deposit: {formatCurrency(property.deposit, property.currency)}
                                    </span>
                                )}
                            </div>

                            <Separator />

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div className="text-center p-4 rounded-xl bg-secondary/50">
                                    <BedDouble className="h-6 w-6 mx-auto mb-2 text-primary" />
                                    <div className="font-semibold">{property.beds}</div>
                                    <div className="text-xs text-muted-foreground">Bedrooms</div>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-secondary/50">
                                    <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                                    <div className="font-semibold">{property.baths}</div>
                                    <div className="text-xs text-muted-foreground">Bathrooms</div>
                                </div>
                                {property.size_sqft && (
                                    <div className="text-center p-4 rounded-xl bg-secondary/50">
                                        <Maximize className="h-6 w-6 mx-auto mb-2 text-primary" />
                                        <div className="font-semibold">{property.size_sqft}</div>
                                        <div className="text-xs text-muted-foreground">Sq Ft</div>
                                    </div>
                                )}
                                <div className="text-center p-4 rounded-xl bg-secondary/50">
                                    <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                                    <div className="font-semibold text-sm">
                                        {new Date(property.created_at).toLocaleDateString("en-US", {
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Listed</div>
                                </div>
                            </div>

                            <Separator />

                            {/* Description */}
                            <div>
                                <h2 className="font-display text-xl font-semibold mb-4">
                                    Description
                                </h2>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {property.description}
                                </p>
                            </div>

                            {/* Amenities */}
                            {property.amenities && property.amenities.length > 0 && (
                                <div>
                                    <h2 className="font-display text-xl font-semibold mb-4">
                                        Amenities
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {property.amenities.map((amenity) => (
                                            <Badge key={amenity} variant="secondary" className="text-sm py-1.5 px-3">
                                                {amenity}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Availability */}
                            {blocks.length > 0 && (
                                <div>
                                    <h2 className="font-display text-xl font-semibold mb-4">
                                        Availability
                                    </h2>
                                    <AvailabilityCalendar blocks={blocks} />
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Agent Card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-4">
                                {agent && (
                                    <div className="rounded-2xl border p-6 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                {agent.photo_url ? (
                                                    <img
                                                        src={agent.photo_url}
                                                        alt={agent.name}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="h-6 w-6 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{agent.name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Verified Agent
                                                </p>
                                            </div>
                                        </div>

                                        {agent.bio && (
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                                {agent.bio}
                                            </p>
                                        )}

                                        {agent.service_areas && agent.service_areas.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {agent.service_areas.map((area) => (
                                                    <Badge key={area} variant="outline" className="text-xs">
                                                        {area}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        <Button asChild variant="outline" className="w-full">
                                            <Link href={`/agents/${agent.id}`}>View Profile</Link>
                                        </Button>
                                    </div>
                                )}

                                {/* WhatsApp CTA with AI */}
                                {agent && (
                                    <PropertyAIFeatures
                                        description={property.description}
                                        price={property.rent}
                                        currency={property.currency}
                                        propertyId={property.id}
                                        propertyTitle={property.title}
                                        agentName={agent.name}
                                        whatsappNumber={agent.whatsapp_number}
                                        propertyDetails={{
                                            type: property.type,
                                            beds: property.beds,
                                            baths: property.baths,
                                            area: property.area,
                                            city: property.city,
                                            rent: property.rent,
                                            currency: property.currency,
                                            amenities: property.amenities,
                                            furnished: property.furnished,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky CTA */}
            {agent && (
                <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t lg:hidden z-50">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="font-display font-bold text-lg">
                                {formatCurrency(property.rent, property.currency)}
                                <span className="text-sm font-normal text-muted-foreground">
                                    /mo
                                </span>
                            </div>
                        </div>
                        <WhatsAppButton
                            whatsappNumber={agent.whatsapp_number}
                            agentName={agent.name}
                            propertyTitle={property.title}
                            propertyId={property.id}
                            size="lg"
                        />
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}
