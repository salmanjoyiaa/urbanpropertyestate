"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MessageCircle, MapPin, FileText, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [bio, setBio] = useState("");
    const [serviceAreas, setServiceAreas] = useState<string[]>([]);
    const [newArea, setNewArea] = useState("");

    useEffect(() => {
        async function loadProfile() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profile) {
                setName(profile.name || "");
                setPhone(profile.phone || "");
                setWhatsappNumber(profile.whatsapp_number || "");
                setBio(profile.bio || "");
                setServiceAreas(profile.service_areas || []);
            }
            setLoading(false);
        }
        loadProfile();
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSaved(false);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    name: name.trim(),
                    phone: phone.trim(),
                    whatsapp_number: whatsappNumber.trim().replace(/[^\d]/g, ""),
                    bio: bio.trim(),
                    service_areas: serviceAreas,
                })
                .eq("id", user.id);

            if (updateError) throw updateError;
            setSaved(true);
            router.refresh();
            setTimeout(() => setSaved(false), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const addServiceArea = () => {
        const area = newArea.trim();
        if (area && !serviceAreas.includes(area)) {
            setServiceAreas([...serviceAreas, area]);
            setNewArea("");
        }
    };

    const removeServiceArea = (area: string) => {
        setServiceAreas(serviceAreas.filter((a) => a !== area));
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-9 w-40 bg-muted rounded animate-pulse" />
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="font-display text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Update your agent profile visible to tenants
                </p>
            </div>

            {/* Profile completeness check */}
            {(!whatsappNumber || !bio || serviceAreas.length === 0) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-800 mb-2">
                        Complete your profile to attract more tenants
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                        {!whatsappNumber && (
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                                Add WhatsApp number
                            </Badge>
                        )}
                        {!bio && (
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                                Add bio
                            </Badge>
                        )}
                        {serviceAreas.length === 0 && (
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                                Add service areas
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            <Phone className="h-3.5 w-3.5 inline mr-1" />
                            Phone Number
                        </Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+923001234567"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">
                            <MessageCircle className="h-3.5 w-3.5 inline mr-1" />
                            WhatsApp Number
                        </Label>
                        <Input
                            id="whatsapp"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            placeholder="923001234567 (no + or spaces)"
                        />
                        <p className="text-xs text-muted-foreground">
                            E.164 format without +. This is used for the &quot;Book on WhatsApp&quot; button.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">
                            <FileText className="h-3.5 w-3.5 inline mr-1" />
                            Bio
                        </Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell tenants about yourself and your experience..."
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            <MapPin className="h-3.5 w-3.5 inline mr-1" />
                            Service Areas
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                value={newArea}
                                onChange={(e) => setNewArea(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addServiceArea())}
                                placeholder="Add a city or area..."
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addServiceArea}
                                disabled={!newArea.trim()}
                            >
                                Add
                            </Button>
                        </div>
                        {serviceAreas.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {serviceAreas.map((area) => (
                                    <Badge key={area} variant="secondary" className="gap-1 text-sm">
                                        {area}
                                        <button
                                            onClick={() => removeServiceArea(area)}
                                            className="ml-1 text-muted-foreground hover:text-foreground"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                    {error}
                </div>
            )}

            {saved && (
                <div className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Profile saved successfully!
                </div>
            )}

            <Button onClick={handleSave} disabled={saving} size="lg" className="w-full sm:w-auto">
                {saving ? (
                    "Saving..."
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Profile
                    </>
                )}
            </Button>
        </div>
    );
}
