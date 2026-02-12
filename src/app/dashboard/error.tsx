"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="flex items-center justify-center py-20 px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-3">
                    Dashboard Error
                </h2>
                <p className="text-muted-foreground mb-6">
                    Something went wrong loading the dashboard. This could be a temporary issue.
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={reset} variant="default">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
