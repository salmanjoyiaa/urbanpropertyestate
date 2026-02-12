"use client";

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ComplianceCheck, ComplianceViolation } from "@/lib/ai/types";

interface ComplianceBadgeProps {
    text: string;
    mode?: "quick" | "full";
    showDetails?: boolean;
}

export default function ComplianceBadge({ text, mode = "quick", showDetails = false }: ComplianceBadgeProps) {
    const [result, setResult] = useState<ComplianceCheck | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!text?.trim() || text.length < 10) { setResult(null); return; }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/ai/compliance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text, mode }),
                });
                if (res.ok) setResult(await res.json());
            } catch { } finally { setLoading(false); }
        }, mode === "quick" ? 500 : 1000);
        return () => clearTimeout(timer);
    }, [text, mode]);

    if (!text?.trim() || text.length < 10) return null;
    if (loading) return <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Checking...</div>;
    if (!result) return null;

    if (result.passed) {
        return <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><CheckCircle className="h-3 w-3" />Compliant</Badge>;
    }

    const criticalCount = result.violations.filter(v => v.severity === "critical").length;
    return (
        <div className="space-y-2">
            <button onClick={() => showDetails && setExpanded(!expanded)} className="inline-flex items-center gap-1.5">
                <Badge variant="outline" className={`text-xs gap-1 ${criticalCount > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    <AlertTriangle className="h-3 w-3" />
                    {criticalCount > 0 ? `${criticalCount} issue(s)` : `${result.violations.length} warning(s)`}
                </Badge>
                {showDetails && (expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
            </button>
            {expanded && (
                <div className="space-y-1.5 pl-2 border-l-2 border-amber-200">
                    {result.violations.map((v: ComplianceViolation, i: number) => (
                        <div key={i} className="text-xs">
                            <span className={v.severity === "critical" ? "text-red-600 font-medium" : "text-amber-600"}>
                                {v.severity === "critical" ? "⛔" : "⚠️"} {v.text}
                            </span>
                            <p className="text-muted-foreground mt-0.5">Fix: {v.suggestion}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
