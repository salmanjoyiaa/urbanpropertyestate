import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Building2,
    LayoutDashboard,
    Plus,
    LogOut,
    User,
    Users,
    ShoppingBag,
    ClipboardList,
    CalendarDays,
    Shield,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import DashboardNav from "./dashboard-nav";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();

    const role = (profile?.role || "customer") as UserRole;

    if (role === "customer") {
        redirect("/");
    }

    const isAdmin = role === "admin";

    const agentNavItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Properties", shortLabel: "Props" },
        { href: "/dashboard/properties/new", icon: Plus, label: "New Property", shortLabel: "New" },
        { href: "/dashboard/agent/availability", icon: CalendarDays, label: "Availability", shortLabel: "Slots" },
        { href: "/dashboard/agent/marketplace", icon: ShoppingBag, label: "Marketplace", shortLabel: "Market" },
        { href: "/dashboard/leads", icon: Users, label: "Leads", shortLabel: "Leads" },
    ];

    const adminNavItems = [
        { href: "/dashboard/admin", icon: LayoutDashboard, label: "Overview", shortLabel: "Home" },
        { href: "/dashboard/admin/leads", icon: Users, label: "Leads", shortLabel: "Leads" },
        { href: "/dashboard/admin/properties", icon: Building2, label: "Properties", shortLabel: "Props" },
        { href: "/dashboard/properties/new", icon: Plus, label: "Add Property", shortLabel: "Add" },
        { href: "/dashboard/marketplace", icon: ShoppingBag, label: "Marketplace", shortLabel: "Market" },
        { href: "/dashboard/admin/bookings", icon: ClipboardList, label: "Bookings", shortLabel: "Books" },
        { href: "/dashboard/admin/agents", icon: Users, label: "Agents", shortLabel: "Agents" },
        { href: "/dashboard/admin/audit-logs", icon: FileText, label: "Audit Logs", shortLabel: "Logs" },
    ];

    const navItems = isAdmin ? adminNavItems : agentNavItems;
    const mobileNavItems = navItems.slice(0, 6);

    return (
        <div className="min-h-screen bg-secondary/30">
            {/* Top Nav */}
            <header className="sticky top-0 z-50 bg-background border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2">
                            <Building2 className="h-7 w-7 text-primary" />
                            <span className="font-display text-lg font-bold hidden sm:inline">
                                UrbanEstate
                            </span>
                        </Link>

                        <DashboardNav items={navItems} mobileItems={mobileNavItems} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/profile"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {isAdmin && (
                                <Badge variant="destructive" className="text-xs">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Admin
                                </Badge>
                            )}
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                {profile?.name || user.email}
                            </span>
                        </Link>
                        <form action="/auth/signout" method="POST">
                            <Button variant="ghost" size="icon" title="Sign out" type="submit">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
                {children}
            </main>
        </div>
    );
}
