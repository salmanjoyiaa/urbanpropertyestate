import Link from "next/link";
import { ArrowRight, Building2, Shield, MessageCircle, Star, Clock, Wrench, Zap, Droplets, Paintbrush, Thermometer, Sparkles, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { createClient } from "@/lib/supabase/server";
import PropertyCard from "@/components/property-card";
import type { Property } from "@/lib/types";

export default async function HomePage() {
    let featuredProperties: Property[] = [];

    try {
        const supabase = createClient();
        const { data } = await supabase
            .from("properties")
            .select("*, agent:profiles(*), property_photos(*)")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(6);
        featuredProperties = (data as Property[]) || [];
    } catch {
        // Supabase not connected yet — show empty state
    }

    return (
        <main className="min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center gradient-primary overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
                    <div className="max-w-3xl">
                        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
                            <Star className="h-4 w-4 text-yellow-400" />
                            Trusted by 500+ tenants worldwide
                        </div>

                        <h1 className="animate-fade-in-up font-display text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6" style={{ animationDelay: "0.1s" }}>
                            Find Your
                            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Perfect Rental
                            </span>
                        </h1>

                        <p className="animate-fade-in-up text-lg sm:text-xl text-white/70 max-w-xl mb-10" style={{ animationDelay: "0.2s" }}>
                            Discover premium apartments, houses, and flats from verified
                            agents. Book directly via WhatsApp — no middlemen, no hassle.
                        </p>

                        <div className="animate-fade-in-up flex flex-col sm:flex-row gap-4" style={{ animationDelay: "0.3s" }}>
                            <Button asChild size="xl" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                                <Link href="/properties">
                                    Browse Properties
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="xl"
                                variant="outline"
                                className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 hover:border-white/60 font-semibold backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                <Link href="/login">Agent Login</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Props */}
            <section className="py-20 bg-secondary/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 animate-fade-in-up">
                        <h2 className="font-display text-3xl font-bold mb-4">
                            Why Choose UrbanEstate?
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            The simplest way to find and book rental properties
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
                        {[
                            {
                                icon: Building2,
                                title: "Verified Listings",
                                description:
                                    "Every property is listed by a verified agent with detailed photos, pricing, and availability.",
                            },
                            {
                                icon: MessageCircle,
                                title: "Book via WhatsApp",
                                description:
                                    "Connect directly with agents on WhatsApp. No forms, no waiting — just instant communication.",
                            },
                            {
                                icon: Shield,
                                title: "Secure & Transparent",
                                description:
                                    "Clear pricing, real photos, and verified agent profiles. What you see is what you get.",
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="group p-8 rounded-2xl bg-background border hover:shadow-xl card-glow transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                    <item.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-display text-lg font-semibold mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            {featuredProperties.length > 0 && (
                <section className="py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="font-display text-3xl font-bold mb-2">
                                    Featured Properties
                                </h2>
                                <p className="text-muted-foreground">
                                    Hand-picked rentals from our top agents
                                </p>
                            </div>
                            <Button asChild variant="outline" className="hover:scale-[1.02] transition-transform">
                                <Link href="/properties">
                                    View All
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                            {featuredProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Maintenance Management Section */}
            <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Content */}
                        <div className="animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
                                <Clock className="h-4 w-4" />
                                24-Hour Response Guarantee
                            </div>

                            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                                Complete Property
                                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Maintenance Services
                                </span>
                            </h2>

                            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                                From leaky faucets to full renovations — our trusted maintenance team handles all types of property repairs and upkeep within <strong className="text-foreground">24 hours</strong> of reaching out.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button asChild size="xl" className="bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-600/25">
                                    <a href="https://wa.me/923177779990?text=Hi%2C%20I%20need%20maintenance%20help%20for%20my%20property" target="_blank" rel="noopener noreferrer">
                                        <PhoneCall className="mr-2 h-5 w-5" />
                                        Request Maintenance
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="xl" className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                                    <Link href="/properties">
                                        Browse Properties
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Right: Service Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger-children">
                            {[
                                { icon: Droplets, title: "Plumbing", desc: "Leaks, pipes, fixtures", color: "bg-blue-50 text-blue-600" },
                                { icon: Zap, title: "Electrical", desc: "Wiring, outlets, panels", color: "bg-amber-50 text-amber-600" },
                                { icon: Thermometer, title: "HVAC", desc: "AC, heating, ventilation", color: "bg-red-50 text-red-600" },
                                { icon: Wrench, title: "Appliance", desc: "Repairs & installation", color: "bg-purple-50 text-purple-600" },
                                { icon: Paintbrush, title: "Painting", desc: "Interior & exterior", color: "bg-emerald-50 text-emerald-600" },
                                { icon: Sparkles, title: "Deep Clean", desc: "Move-in/move-out ready", color: "bg-cyan-50 text-cyan-600" },
                            ].map((service) => (
                                <div
                                    key={service.title}
                                    className="group p-5 rounded-2xl bg-white border hover:shadow-lg card-glow transition-all duration-300 hover:-translate-y-1 text-center"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                        <service.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-display font-semibold text-sm mb-1">{service.title}</h3>
                                    <p className="text-xs text-muted-foreground">{service.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trust bar */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-muted-foreground">
                        {[
                            { icon: Shield, text: "Licensed & Insured" },
                            { icon: Clock, text: "24h Response Time" },
                            { icon: Star, text: "4.9★ Customer Rating" },
                            { icon: Wrench, text: "All Types Covered" },
                        ].map((item) => (
                            <div key={item.text} className="flex items-center gap-2">
                                <item.icon className="h-4 w-4 text-emerald-600" />
                                <span className="font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 gradient-primary">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-6">
                        Are You a Property Agent?
                    </h2>
                    <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
                        List your properties, manage availability, and connect with quality
                        tenants — all from your dashboard.
                    </p>
                    <Button asChild size="xl" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-lg shadow-white/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                        <Link href="/login">
                            Get Started Free
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </section>

            <Footer />
        </main>
    );
}
