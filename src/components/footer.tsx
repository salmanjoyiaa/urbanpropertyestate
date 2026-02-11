import Link from "next/link";
import { Building2 } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-foreground text-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <Building2 className="h-8 w-8" />
                            <span className="font-display text-xl font-bold">UrbanEstate</span>
                        </div>
                        <p className="text-sm opacity-70 max-w-sm">
                            Premium rental properties connecting verified agents with quality
                            tenants. Find your perfect home today.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-display font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm opacity-70">
                            <li>
                                <Link href="/properties" className="hover:opacity-100 transition-opacity">
                                    Browse Properties
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="hover:opacity-100 transition-opacity">
                                    Agent Login
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-display font-semibold mb-4">Contact</h4>
                        <ul className="space-y-2 text-sm opacity-70">
                            <li>info@urbanestate.com</li>
                            <li>Karachi, Pakistan</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm opacity-50">
                    © {new Date().getFullYear()} UrbanEstate. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
