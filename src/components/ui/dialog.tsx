"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    React.useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") onOpenChange(false);
        }
        if (open) {
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [open, onOpenChange]);

    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
                onClick={() => onOpenChange(false)}
            />
            {/* Content */}
            <div className="relative z-[101] w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4 rounded-2xl bg-background border shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
                {children}
            </div>
        </div>,
        document.body
    );
}

export function DialogHeader({
    className,
    children,
    onClose,
}: {
    className?: string;
    children: React.ReactNode;
    onClose?: () => void;
}) {
    return (
        <div className={cn("flex items-start justify-between p-6 pb-0", className)}>
            <div>{children}</div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="rounded-full p-1.5 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

export function DialogBody({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <div className={cn("p-6", className)}>{children}</div>;
}
