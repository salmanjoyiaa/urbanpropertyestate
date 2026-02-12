"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 px-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="font-display text-3xl font-bold mb-3">
                    Something went wrong
                </h1>
                <p className="text-muted-foreground mb-8">
                    We encountered an unexpected error. Please try again or return to the home page.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={reset} variant="default" size="lg">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
