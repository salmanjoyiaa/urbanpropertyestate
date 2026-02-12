"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Building2, ShoppingBag, LayoutDashboard, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<{ email?: string } | null>(null);
    const pathname = usePathname();
    const isHome = pathname === "/";

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user ? { email: user.email } : null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ? { email: session.user.email } : null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // On home hero: transparent with white text; once scrolled: glass with dark text
    const isTransparent = isHome && !scrolled;
    const textColor = isTransparent ? "text-white/90" : "text-muted-foreground";
    const logoColor = isTransparent ? "text-white" : "text-primary";
    const hoverColor = isTransparent ? "hover:text-white" : "hover:text-foreground";

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass border-b shadow-sm" : "bg-transparent"}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <Building2 className={`h-8 w-8 ${logoColor} group-hover:scale-110 transition-transform duration-200`} />
                        <span className={`font-display text-xl font-bold ${logoColor}`}>
                            UrbanEstate
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/properties"
                            className={`text-sm font-medium ${textColor} ${hoverColor} transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all after:duration-300 hover:after:w-full`}
                        >
                            Properties
                        </Link>
                        <Link
                            href="/marketplace"
                            className={`text-sm font-medium ${textColor} ${hoverColor} transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all after:duration-300 hover:after:w-full`}
                        >
                            Marketplace
                        </Link>
                        {user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className={`text-sm font-medium ${textColor} ${hoverColor} transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all after:duration-300 hover:after:w-full flex items-center gap-1.5`}
                                >
                                    <LayoutDashboard className="h-3.5 w-3.5" />
                                    Dashboard
                                </Link>
                                <Button asChild size="sm" className="hover:scale-[1.02] active:scale-[0.98] transition-transform">
                                    <Link href="/dashboard">
                                        <User className="mr-1.5 h-3.5 w-3.5" />
                                        My Account
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className={`text-sm font-medium ${textColor} ${hoverColor} transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all after:duration-300 hover:after:w-full`}
                                >
                                    Agent Login
                                </Link>
                                <Button asChild size="sm" className="hover:scale-[1.02] active:scale-[0.98] transition-transform">
                                    <Link href="/properties">Browse Listings</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`md:hidden p-2 rounded-md ${textColor} ${hoverColor} transition-colors`}
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="glass border-t px-4 py-4 space-y-3">
                    <Link
                        href="/properties"
                        onClick={() => setIsOpen(false)}
                        className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
                    >
                        Properties
                    </Link>
                    <Link
                        href="/marketplace"
                        onClick={() => setIsOpen(false)}
                        className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
                    >
                        Marketplace
                    </Link>
                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                onClick={() => setIsOpen(false)}
                                className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
                            >
                                Dashboard
                            </Link>
                            <form action="/auth/signout" method="POST">
                                <Button type="submit" variant="outline" className="w-full" size="sm">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
                            >
                                Agent Login
                            </Link>
                            <Button asChild className="w-full" size="sm">
                                <Link href="/properties" onClick={() => setIsOpen(false)}>
                                    Browse Listings
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
