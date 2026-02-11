"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Building2 } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass border-b shadow-sm" : "bg-transparent"}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <Building2 className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-200" />
                        <span className="font-display text-xl font-bold text-primary">
                            UrbanEstate
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/properties"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                        >
                            Properties
                        </Link>
                        <Link
                            href="/login"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                        >
                            Agent Login
                        </Link>
                        <Button asChild size="sm" className="hover:scale-[1.02] active:scale-[0.98] transition-transform">
                            <Link href="/properties">Browse Listings</Link>
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
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
                </div>
            </div>
        </nav>
    );
}
