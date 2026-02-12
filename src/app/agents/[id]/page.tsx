import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { MapPin, Phone, User } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PropertyCard from "@/components/property-card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Property } from "@/lib/types";

interface Props {
    params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const supabase = createClient();
        const { data } = await supabase
            .from("profiles")
            .select("name, bio, photo_url")
            .eq("id", params.id)
            .eq("is_public", true)
            .single();
        if (!data) return { title: "Agent Not Found" };
        return {
            title: `${data.name} — Agent Profile`,
            description: data.bio || `View properties listed by ${data.name} on UrbanEstate.`,
            openGraph: {
                title: `${data.name} — Agent Profile`,
                description: data.bio || `View properties listed by ${data.name}`,
                images: data.photo_url ? [{ url: data.photo_url }] : [],
            },
        };
    } catch {
        return { title: "Agent" };
    }
}

export default async function AgentProfilePage({ params }: Props) {
    let agent: Profile | null = null;
    let properties: Property[] = [];

    try {
        const supabase = createClient();

        const { data: agentData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", params.id)
            .eq("is_public", true)
            .single();

        agent = agentData as Profile;

        if (agent) {
            const { data: propData } = await supabase
                .from("properties")
                .select("*, agent:profiles(*), property_photos(*)")
                .eq("agent_id", agent.id)
                .eq("status", "published")
                .order("created_at", { ascending: false });

            properties = (propData as Property[]) || [];
        }
    } catch {
        // Supabase not connected
    }

    if (!agent) {
        notFound();
    }

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="pt-20">
                {/* Agent Header */}
                <section className="gradient-primary py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center shrink-0 border-4 border-white/20 overflow-hidden relative">
                                {agent.photo_url ? (
                                    <Image
                                        src={agent.photo_url}
                                        alt={agent.name}
                                        fill
                                        sizes="112px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <User className="h-12 w-12 text-white/50" />
                                )}
                            </div>
                            <div className="text-center md:text-left text-white">
                                <h1 className="font-display text-3xl font-bold mb-2">
                                    {agent.name}
                                </h1>
                                <p className="text-white/70 mb-4">Verified Agent</p>
                                {agent.bio && (
                                    <p className="text-white/80 max-w-2xl mb-4">{agent.bio}</p>
                                )}
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/70">
                                    {agent.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            {agent.phone}
                                        </div>
                                    )}
                                </div>
                                {agent.service_areas && agent.service_areas.length > 0 && (
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                                        {agent.service_areas.map((area) => (
                                            <Badge
                                                key={area}
                                                className="bg-white/10 text-white border-white/20"
                                            >
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Agent's Properties */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h2 className="font-display text-2xl font-bold mb-8">
                        Listings by {agent.name}
                        <span className="text-muted-foreground font-normal text-lg ml-2">
                            ({properties.length})
                        </span>
                    </h2>

                    {properties.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                No published properties yet.
                            </p>
                        </div>
                    )}
                </section>
            </div>

            <Footer />
        </main>
    );
}
