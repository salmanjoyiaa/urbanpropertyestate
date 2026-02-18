"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, X, Star } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CURRENCY_OPTIONS } from "@/lib/utils";
import type { HouseholdItem, HouseholdItemPhoto, HouseholdItemCategory, ItemCondition } from "@/lib/types";

interface HouseholdItemFormProps {
    item?: HouseholdItem;
    photos?: HouseholdItemPhoto[];
}

const CATEGORIES: { value: HouseholdItemCategory; label: string; emoji: string }[] = [
    { value: "furniture", label: "Furniture", emoji: "🛋️" },
    { value: "electronics", label: "Electronics", emoji: "📺" },
    { value: "appliances", label: "Appliances", emoji: "🔌" },
    { value: "kitchen", label: "Kitchen", emoji: "🍳" },
    { value: "bedroom", label: "Bedroom", emoji: "🛏️" },
    { value: "bathroom", label: "Bathroom", emoji: "🚿" },
    { value: "decor", label: "Decor", emoji: "🖼️" },
    { value: "lighting", label: "Lighting", emoji: "💡" },
    { value: "storage", label: "Storage", emoji: "📦" },
    { value: "outdoor", label: "Outdoor", emoji: "☀️" },
    { value: "kids", label: "Kids", emoji: "🧸" },
    { value: "other", label: "Other", emoji: "📎" },
];

const CONDITIONS: { value: ItemCondition; label: string }[] = [
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "used", label: "Used" },
];

export default function HouseholdItemForm({ item, photos: initialPhotos = [] }: HouseholdItemFormProps) {
    const router = useRouter();
    const isEditing = !!item;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [title, setTitle] = useState(item?.title || "");
    const [category, setCategory] = useState<HouseholdItemCategory>(item?.category || "furniture");
    const [price, setPrice] = useState(item?.price?.toString() || "");
    const [currency, setCurrency] = useState(item?.currency || "USD");
    const [condition, setCondition] = useState<ItemCondition>(item?.condition || "good");
    const [description, setDescription] = useState(item?.description || "");
    const [city, setCity] = useState(item?.city || "");
    const [area, setArea] = useState(item?.area || "");
    const [deliveryAvailable, setDeliveryAvailable] = useState(item?.delivery_available || false);
    const [isNegotiable, setIsNegotiable] = useState(item?.is_negotiable ?? true);
    const [status, setStatus] = useState<"available" | "reserved" | "sold" | "removed">(item?.status || "available");

    const [photos, setPhotos] = useState<HouseholdItemPhoto[]>(initialPhotos);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [coverId, setCoverId] = useState(initialPhotos.find((p) => p.is_cover)?.id || "");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeNewFile = (index: number) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingPhoto = async (photoId: string) => {
        if (!confirm("Delete this photo?")) return;
        const supabase = createClient();
        const { error } = await supabase.from("household_item_photos").delete().eq("id", photoId);
        if (!error) {
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
            if (coverId === photoId) setCoverId("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError("Not authenticated");
            setLoading(false);
            return;
        }

        try {
            const parsedPrice = Math.round(Number(price));
            if (!title.trim() || !price || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > 999999999 || !city.trim() || !area.trim()) {
                setError("Please fill in all required fields (price must be between 1 and 999,999,999)");
                setLoading(false);
                return;
            }

            const itemData = {
                seller_id: user.id,
                agent_id: user.id,
                title: title.trim(),
                category,
                price: parsedPrice,
                currency,
                condition,
                description: description.trim(),
                city: city.trim(),
                area: area.trim(),
                delivery_available: deliveryAvailable,
                is_negotiable: isNegotiable,
                status,
            };

            let itemId = item?.id;

            if (isEditing) {
                const { error: updateError } = await supabase
                    .from("household_items")
                    .update(itemData)
                    .eq("id", item!.id);
                if (updateError) throw updateError;
            } else {
                const { data: newItem, error: insertError } = await supabase
                    .from("household_items")
                    .insert([itemData])
                    .select()
                    .single();
                if (insertError) throw insertError;
                itemId = newItem.id;
            }

            // Upload new photos
            if (newFiles.length > 0) {
                for (let i = 0; i < newFiles.length; i++) {
                    const file = newFiles[i];
                    const fileName = `${itemId}/${Date.now()}-${file.name}`;
                    const { error: uploadError, data } = await supabase.storage
                        .from("household-items")
                        .upload(fileName, file, { upsert: true });

                    if (uploadError) {
                        console.error("Upload error:", uploadError);
                        continue;
                    }

                    const { data: urlData } = supabase.storage
                        .from("household-items")
                        .getPublicUrl(fileName);

                    const isCover = (photos.length === 0 && i === 0) || (!coverId && i === 0);
                    await supabase.from("household_item_photos").insert([
                        {
                            item_id: itemId,
                            url: urlData.publicUrl,
                            position: photos.length + i,
                            is_cover: isCover,
                        },
                    ]);
                }
            }

            // Update cover
            if (coverId) {
                await supabase.from("household_item_photos").update({ is_cover: false }).eq("item_id", itemId!);
                await supabase.from("household_item_photos").update({ is_cover: true }).eq("id", coverId);
            }

            router.push("/dashboard/marketplace");
            router.refresh();
        } catch (err: any) {
            console.error("Save error:", err);
            setError(err.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" asChild>
                    <Link href="/dashboard/marketplace">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
            </div>

            {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>}

            <Card>
                <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Samsung 55'' Smart TV" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="category">Category *</Label>
                            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as HouseholdItemCategory)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" required>
                                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="condition">Condition *</Label>
                            <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" required>
                                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="price">Price *</Label>
                            <Input id="price" type="number" min="1" max="999999999" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="currency">Currency</Label>
                            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                                {CURRENCY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe condition, features..." />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Location</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="area">Area *</Label>
                        <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} required />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Options</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={deliveryAvailable} onChange={(e) => setDeliveryAvailable(e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Delivery available</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Price is negotiable</span>
                    </label>
                    <div>
                        <Label htmlFor="status">Status</Label>
                        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as "available" | "reserved" | "sold" | "removed")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="sold">Sold</option>
                            <option value="removed">Removed</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Photos</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input type="file" accept="image/*" multiple onChange={handleFileChange} />

                    {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {photos.map((p) => (
                                <div key={p.id} className="relative group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.url} alt="Item" className="w-full aspect-square object-cover rounded-lg" />
                                    <button type="button" onClick={() => removeExistingPhoto(p.id)} className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100">
                                        <X className="h-4 w-4" />
                                    </button>
                                    <button type="button" onClick={() => setCoverId(p.id)} className={`absolute bottom-2 left-2 p-1 rounded-full ${coverId === p.id ? "bg-yellow-500 text-white" : "bg-white/80"}`}>
                                        <Star className="h-4 w-4" fill={coverId === p.id ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {newFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {newFiles.map((f, i) => (
                                <div key={i} className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={URL.createObjectURL(f)} alt="Preview" className="w-full aspect-square object-cover rounded-lg" />
                                    <button type="button" onClick={() => removeNewFile(i)} className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button type="submit" disabled={loading} size="lg" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : isEditing ? "Update Item" : "Create Item"}
            </Button>
        </form>
    );
}
