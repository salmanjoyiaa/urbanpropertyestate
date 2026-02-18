"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
    href: string;
    icon: LucideIcon;
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
                    return (
                        <Button
                            key={item.href}
                            asChild
                            variant={active ? "secondary" : "ghost"}
                            size="sm"
                        >
                            <Link href={item.href}>
                                <item.icon className={cn("h-4 w-4 mr-2", active && "text-primary")} />
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
                                <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                                {item.shortLabel}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
