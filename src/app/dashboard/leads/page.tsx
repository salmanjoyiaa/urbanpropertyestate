import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users, Flame, ThermometerSun, Snowflake, Phone, Mail,
    Calendar, ArrowLeft, ExternalLink
} from "lucide-react";

const TEMP_CONFIG = {
    hot: { label: "Hot", icon: Flame, color: "bg-red-100 text-red-800", dotColor: "bg-red-500" },
    warm: { label: "Warm", icon: ThermometerSun, color: "bg-amber-100 text-amber-800", dotColor: "bg-amber-500" },
    cold: { label: "Cold", icon: Snowflake, color: "bg-blue-100 text-blue-800", dotColor: "bg-blue-500" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    new: { label: "New", color: "bg-emerald-100 text-emerald-800" },
    contacted: { label: "Contacted", color: "bg-blue-100 text-blue-800" },
    qualified: { label: "Qualified", color: "bg-purple-100 text-purple-800" },
    converted: { label: "Converted", color: "bg-green-100 text-green-800" },
    lost: { label: "Lost", color: "bg-gray-100 text-gray-800" },
};

export default async function LeadsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: leads } = await supabase
        .from("leads")
        .select("*, property:properties(title, city)")
        .eq("agent_id", user.id)
        .eq("source", "visit_approved")
        .order("created_at", { ascending: false });

    const allLeads = leads || [];
    const hotCount = allLeads.filter((l) => l.temperature === "hot").length;
    const warmCount = allLeads.filter((l) => l.temperature === "warm").length;
    const coldCount = allLeads.filter((l) => l.temperature === "cold").length;
    const newCount = allLeads.filter((l) => l.status === "new").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold">Lead Tracker</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {allLeads.length} approved visit leads · {newCount} new
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Dashboard
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allLeads.length}</p>
                                <p className="text-xs text-muted-foreground">Total Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <Flame className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{hotCount}</p>
                                <p className="text-xs text-muted-foreground">Hot Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <ThermometerSun className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{warmCount}</p>
                                <p className="text-xs text-muted-foreground">Warm Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Snowflake className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{coldCount}</p>
                                <p className="text-xs text-muted-foreground">Cold Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Leads list */}
            {allLeads.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-1">No leads yet</h3>
                        <p className="text-muted-foreground text-sm">
                            Visit leads appear here after admin approval
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {allLeads.map((lead) => {
                        const temp = TEMP_CONFIG[lead.temperature as keyof typeof TEMP_CONFIG] || TEMP_CONFIG.warm;
                        const status = STATUS_CONFIG[lead.status as string] || STATUS_CONFIG.new;
                        const TempIcon = temp.icon;

                        return (
                            <Card key={lead.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        {/* Temperature indicator */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${temp.color}`}>
                                            <TempIcon className="h-5 w-5" />
                                        </div>

                                        {/* Lead info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-sm">
                                                    {lead.contact_name || "Anonymous"}
                                                </h3>
                                                <Badge className={`text-xs ${status.color}`}>
                                                    {status.label}
                                                </Badge>
                                                {lead.score && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Score: {lead.score}/100
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                                {lead.message}
                                            </p>

                                            {/* AI Reasons */}
                                            {lead.ai_reasons && lead.ai_reasons.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {lead.ai_reasons.slice(0, 3).map((reason: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
                                                            {reason}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Suggested Follow-up */}
                                            {lead.suggested_follow_up && (
                                                <p className="text-xs text-primary/80 mt-1 italic">
                                                    💡 {lead.suggested_follow_up}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                {lead.contact_phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {lead.contact_phone}
                                                    </span>
                                                )}
                                                {lead.contact_email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {lead.contact_email}
                                                    </span>
                                                )}
                                                {lead.property?.title && (
                                                    <span className="flex items-center gap-1">
                                                        <ExternalLink className="h-3 w-3" />
                                                        {lead.property.title}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
