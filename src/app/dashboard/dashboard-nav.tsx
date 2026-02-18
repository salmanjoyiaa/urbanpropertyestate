"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Plus,
    CalendarDays,
    ShoppingBag,
    Users,
    Building2,
    ClipboardList,
    FileText,
    type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    Plus,
    CalendarDays,
    ShoppingBag,
    Users,
    Building2,
    ClipboardList,
    FileText,
};

export interface NavItem {
    href: string;
    icon: string;
    label: string;
    shortLabel: string;
}

interface DashboardNavProps {
    items: NavItem[];
    mobileItems: NavItem[];
}

export default function DashboardNav({ items, mobileItems }: DashboardNavProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard" || href === "/dashboard/admin") {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
                {items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = iconMap[item.icon] || LayoutDashboard;
                    return (
                        <Button
                            key={item.href}
                            asChild
                            variant={active ? "secondary" : "ghost"}
                            size="sm"
                        >
                            <Link href={item.href}>
                                <Icon className={cn("h-4 w-4 mr-2", active && "text-primary")} />
                                {item.label}
                            </Link>
                        </Button>
                    );
                })}
            </nav>

            {/* Mobile bottom nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
                <div className="flex items-center justify-around py-2">
                    {mobileItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-1 text-xs p-2 transition-colors",
                                    active
                                        ? "text-primary font-medium"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                                {item.shortLabel}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
