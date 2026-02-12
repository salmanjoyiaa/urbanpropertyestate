import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Building2,
    LayoutDashboard,
    Plus,
    LogOut,
    User,
    Users,
    BarChart3,
    ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

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

    // Get or create profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

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

                        <nav className="hidden md:flex items-center gap-1">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/dashboard">
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/dashboard/properties/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Property
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/dashboard/leads">
                                    <Users className="h-4 w-4 mr-2" />
                                    Leads
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/dashboard/analytics">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Analytics
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/dashboard/marketplace">
                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                    Marketplace
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/dashboard/profile">
                                    <User className="h-4 w-4 mr-2" />
                                    Profile
                                </Link>
                            </Button>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                {profile?.name || user.email}
                            </span>
                        </div>
                        <form action="/auth/signout" method="POST">
                            <Button variant="ghost" size="icon" title="Sign out" type="submit">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Mobile bottom nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
                <div className="flex items-center justify-around py-2">
                    <Link
                        href="/dashboard"
                        className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-2"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/dashboard/properties/new"
                        className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-2"
                    >
                        <Plus className="h-5 w-5" />
                        New
                    </Link>
                    <Link
                        href="/dashboard/leads"
                        className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-2"
                    >
                        <Users className="h-5 w-5" />
                        Leads
                    </Link>
                    <Link
                        href="/dashboard/analytics"
                        className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-2"
                    >
                        <BarChart3 className="h-5 w-5" />
                        Analytics
                    </Link>
                    <Link
                        href="/dashboard/marketplace"
                        className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-2"
                    >
                        <ShoppingBag className="h-5 w-5" />
                        Market
                    </Link>
                    <Link
                        href="/dashboard/profile"
                        className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-2"
                    >
                        <User className="h-5 w-5" />
                        Profile
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
                {children}
            </main>
        </div>
    );
}
