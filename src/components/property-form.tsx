"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Save,
    Upload,
    X,
    Star,
    GripVertical,
    Plus,
    Trash2,
    CalendarDays,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CURRENCY_OPTIONS } from "@/lib/utils";
import type { Property, PropertyPhoto, PropertyBlock } from "@/lib/types";
import AICopilotPanel from "@/components/ai-copilot-panel";
import ComplianceBadge from "@/components/compliance-badge";
import PricingInsight from "@/components/pricing-insight";

interface PropertyFormProps {
    property?: Property;
    photos?: PropertyPhoto[];
    blocks?: PropertyBlock[];
}

const TYPES = [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "flat", label: "Flat" },
];

const AMENITIES_OPTIONS = [
    "AC",
    "Parking",
    "WiFi",
    "Gym",
    "Pool",
    "Laundry",
    "Elevator",
    "Security",
    "Balcony",
    "Garden",
    "Servant Quarter",
    "Generator",
    "Water Tank",
    "CCTV",
];

export default function PropertyForm({
    property,
    photos: initialPhotos = [],
    blocks: initialBlocks = [],
}: PropertyFormProps) {
    const router = useRouter();
    const isEditing = !!property;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [title, setTitle] = useState(property?.title || "");
    const [type, setType] = useState<string>(property?.type || "apartment");
    const [rent, setRent] = useState(property?.rent?.toString() || "");
    const [deposit, setDeposit] = useState(property?.deposit?.toString() || "0");
    const [city, setCity] = useState(property?.city || "");
    const [area, setArea] = useState(property?.area || "");
    const [streetAddress, setStreetAddress] = useState(property?.street_address || "");
    const [beds, setBeds] = useState(property?.beds?.toString() || "1");
    const [baths, setBaths] = useState(property?.baths?.toString() || "1");
    const [sizeSqft, setSizeSqft] = useState(property?.size_sqft?.toString() || "");
    const [furnished, setFurnished] = useState(property?.furnished || false);
    const [amenities, setAmenities] = useState<string[]>(property?.amenities || []);
    const [description, setDescription] = useState(property?.description || "");
    const [status, setStatus] = useState(property?.status || "draft");
    const [currency, setCurrency] = useState(property?.currency || "USD");

    // Photos state
    const [photos, setPhotos] = useState<PropertyPhoto[]>(initialPhotos);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [coverId, setCoverId] = useState(
        initialPhotos.find((p) => p.is_cover)?.id || ""
    );

    // Blocks state
    const [blocks, setBlocks] = useState<
        Array<{ id?: string; start_date: string; end_date: string; note: string }>
    >(
        initialBlocks.map((b) => ({
            id: b.id,
            start_date: b.start_date,
            end_date: b.end_date,
            note: b.note || "",
        }))
    );

    const toggleAmenity = (amenity: string) => {
        setAmenities((prev) =>
            prev.includes(amenity)
                ? prev.filter((a) => a !== amenity)
                : [...prev, amenity]
        );
    };

    const addBlock = () => {
        setBlocks((prev) => [
            ...prev,
            { start_date: "", end_date: "", note: "" },
        ]);
    };

    const removeBlock = (index: number) => {
        setBlocks((prev) => prev.filter((_, i) => i !== index));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
        const valid: File[] = [];
        const rejected: string[] = [];
        for (const f of files) {
            if (f.size > MAX_SIZE) {
                rejected.push(f.name);
            } else {
                valid.push(f);
            }
        }
        if (rejected.length > 0) {
            setError(`Files too large (max 5 MB): ${rejected.join(", ")}`);
        }
        setNewFiles((prev) => [...prev, ...valid]);
    };

    const removeNewFile = (index: number) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError("");

        const supabase = createClient();

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const propertyData = {
                agent_id: user.id,
                title,
                type,
                rent: parseInt(rent),
                deposit: parseInt(deposit) || 0,
                currency,
                city,
                area,
                street_address: streetAddress,
                beds: parseInt(beds),
                baths: parseInt(baths),
                size_sqft: sizeSqft ? parseInt(sizeSqft) : null,
                furnished,
                amenities,
                description,
                status,
            };

            let propertyId = property?.id;

            if (isEditing) {
                const { error } = await supabase
                    .from("properties")
                    .update(propertyData)
                    .eq("id", propertyId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from("properties")
                    .insert(propertyData)
                    .select("id")
                    .single();
                if (error) throw error;
                propertyId = data.id;
            }

            // Upload new photos
            if (newFiles.length > 0 && propertyId) {
                const existingCount = photos.length;

                for (let i = 0; i < newFiles.length; i++) {
                    const file = newFiles[i];
                    const fileName = `${Date.now()}-${file.name}`;
                    const path = `properties/${user.id}/${propertyId}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from("property-photos")
                        .upload(path, file);

                    if (uploadError) continue;

                    const {
                        data: { publicUrl },
                    } = supabase.storage.from("property-photos").getPublicUrl(path);

                    await supabase.from("property_photos").insert({
                        property_id: propertyId,
                        url: publicUrl,
                        position: existingCount + i,
                        is_cover: existingCount === 0 && i === 0 && !coverId,
                    });
                }
            }

            // Update cover photo
            if (coverId && propertyId) {
                await supabase
                    .from("property_photos")
                    .update({ is_cover: false })
                    .eq("property_id", propertyId);
                await supabase
                    .from("property_photos")
                    .update({ is_cover: true })
                    .eq("id", coverId);
            }

            // Handle blocks
            if (propertyId) {
                // Delete existing blocks
                await supabase
                    .from("property_blocks")
                    .delete()
                    .eq("property_id", propertyId);

                // Insert new blocks
                const validBlocks = blocks.filter(
                    (b) => b.start_date && b.end_date
                );
                if (validBlocks.length > 0) {
                    await supabase.from("property_blocks").insert(
                        validBlocks.map((b) => ({
                            property_id: propertyId,
                            start_date: b.start_date,
                            end_date: b.end_date,
                            note: b.note || null,
                        }))
                    );
                }
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save property");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" type="button">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-bold">
                            {isEditing ? "Edit Property" : "New Property"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEditing
                                ? "Update your listing details"
                                : "Create a new property listing"}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="submit"
                        disabled={loading}
                        onClick={() => setStatus("draft")}
                        variant="outline"
                    >
                        {loading && status === "draft" ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Draft"
                        )}
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        onClick={() => setStatus("published")}
                    >
                        {loading && status === "published" ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Publish
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Property Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Modern 2BR Apartment in Gulshan"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <select
                                        id="type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        {TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="furnished">
                                        <input
                                            type="checkbox"
                                            id="furnished"
                                            checked={furnished}
                                            onChange={(e) => setFurnished(e.target.checked)}
                                            className="mr-2"
                                        />
                                        Furnished
                                    </Label>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <select
                                        id="currency"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        {CURRENCY_OPTIONS.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rent">Monthly Rent</Label>
                                    <Input
                                        id="rent"
                                        type="number"
                                        min="1"
                                        value={rent}
                                        onChange={(e) => setRent(e.target.value)}
                                        placeholder="1500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deposit">Deposit</Label>
                                    <Input
                                        id="deposit"
                                        type="number"
                                        min="0"
                                        value={deposit}
                                        onChange={(e) => setDeposit(e.target.value)}
                                        placeholder="3000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="beds">Bedrooms</Label>
                                    <Input
                                        id="beds"
                                        type="number"
                                        min="0"
                                        value={beds}
                                        onChange={(e) => setBeds(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="baths">Bathrooms</Label>
                                    <Input
                                        id="baths"
                                        type="number"
                                        min="0"
                                        value={baths}
                                        onChange={(e) => setBaths(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="size">Size (sqft)</Label>
                                    <Input
                                        id="size"
                                        type="number"
                                        value={sizeSqft}
                                        onChange={(e) => setSizeSqft(e.target.value)}
                                        placeholder="1200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Location</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Karachi"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="area">Area</Label>
                                    <Input
                                        id="area"
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                        placeholder="Gulshan-e-Iqbal"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="street">Street Address</Label>
                                <Input
                                    id="street"
                                    value={streetAddress}
                                    onChange={(e) => setStreetAddress(e.target.value)}
                                    placeholder="Block 10, Street 5"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description & Amenities */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Description & Amenities</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="description">Description</Label>
                                    <ComplianceBadge text={description} mode="quick" showDetails />
                                </div>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the property, its features, neighborhood, etc."
                                    rows={5}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Amenities</Label>
                                <div className="flex flex-wrap gap-2">
                                    {AMENITIES_OPTIONS.map((amenity) => (
                                        <button
                                            key={amenity}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity)}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${amenities.includes(amenity)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background text-muted-foreground border-input hover:border-primary"
                                                }`}
                                        >
                                            {amenity}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* AI Copilot */}
                    <AICopilotPanel
                        onApply={(aiTitle, aiDesc) => {
                            setTitle(aiTitle);
                            setDescription(aiDesc);
                        }}
                        propertyData={{
                            type,
                            beds: parseInt(beds) || 0,
                            baths: parseInt(baths) || 0,
                            rent: parseFloat(rent) || 0,
                            currency,
                            city,
                            area,
                            amenities,
                            furnished,
                        }}
                    />

                    {/* Pricing Insight */}
                    {city && beds && rent && (
                        <PricingInsight
                            city={city}
                            area={area}
                            beds={parseInt(beds) || 0}
                            type={type}
                            currentPrice={parseFloat(rent) || 0}
                            currency={currency}
                            amenities={amenities}
                            furnished={furnished}
                        />
                    )}

                    {/* Photos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Photos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Existing photos */}
                            {photos.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {photos.map((photo) => (
                                        <div
                                            key={photo.id}
                                            className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${coverId === photo.id
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-transparent"
                                                }`}
                                            onClick={() => setCoverId(photo.id)}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={photo.url}
                                                alt="Property photo"
                                                className="w-full h-full object-cover"
                                            />
                                            {coverId === photo.id && (
                                                <div className="absolute top-1 left-1">
                                                    <Badge className="bg-primary text-xs">
                                                        <Star className="h-3 w-3 mr-1" />
                                                        Cover
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* New file previews */}
                            {newFiles.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {newFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="New upload preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewFile(i)}
                                                className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    Click to upload photos (max 5 MB each)
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                        </CardContent>
                    </Card>

                    {/* Availability Blocks */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                Availability Blocks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Block dates when the property is unavailable
                            </p>

                            {blocks.map((block, index) => (
                                <div
                                    key={index}
                                    className="space-y-2 p-3 rounded-lg border bg-muted/50"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">
                                            Block {index + 1}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeBlock(index)}
                                            className="text-destructive hover:text-destructive/80"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">Start</Label>
                                            <Input
                                                type="date"
                                                value={block.start_date}
                                                onChange={(e) => {
                                                    const updated = [...blocks];
                                                    updated[index].start_date = e.target.value;
                                                    setBlocks(updated);
                                                }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">End</Label>
                                            <Input
                                                type="date"
                                                value={block.end_date}
                                                min={block.start_date || undefined}
                                                onChange={(e) => {
                                                    const updated = [...blocks];
                                                    updated[index].end_date = e.target.value;
                                                    setBlocks(updated);
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Input
                                        placeholder="Note (optional)"
                                        value={block.note}
                                        onChange={(e) => {
                                            const updated = [...blocks];
                                            updated[index].note = e.target.value;
                                            setBlocks(updated);
                                        }}
                                    />
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addBlock}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Block
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
