"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogBody } from "@/components/ui/dialog";
import {
    Plus,
    Pencil,
    Trash2,
    Package,
    ShoppingBag,
    DollarSign,
    MapPin,
    Loader2,
} from "lucide-react";
import {
    createMarketplaceItem,
    updateMarketplaceItem,
    deleteMarketplaceItem,
    getAgentMarketplaceItems,
} from "@/actions/marketplace-items";
import type { HouseholdItemCategory, ItemCondition } from "@/lib/types";

const CATEGORIES: { value: HouseholdItemCategory; label: string }[] = [
    { value: "furniture", label: "Furniture" },
    { value: "electronics", label: "Electronics" },
    { value: "appliances", label: "Appliances" },
    { value: "kitchen", label: "Kitchen" },
    { value: "bedroom", label: "Bedroom" },
    { value: "bathroom", label: "Bathroom" },
    { value: "decor", label: "Decor" },
    { value: "lighting", label: "Lighting" },
    { value: "storage", label: "Storage" },
    { value: "outdoor", label: "Outdoor" },
    { value: "kids", label: "Kids" },
    { value: "other", label: "Other" },
];

const CONDITIONS: { value: ItemCondition; label: string }[] = [
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "used", label: "Used" },
];

const STATUS_COLORS: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    reserved: "bg-yellow-100 text-yellow-800",
    sold: "bg-blue-100 text-blue-800",
    removed: "bg-gray-100 text-gray-800",
};

interface MarketplaceItem {
    id: string;
    title: string;
    category: string;
    price: number;
    currency: string;
    condition: string;
    description: string;
    city: string;
    area: string;
    delivery_available: boolean;
    is_negotiable: boolean;
    status: string;
    created_at: string;
    household_item_photos?: { id: string; url: string; is_cover: boolean }[];
}

interface FormState {
    title: string;
    category: string;
    price: string;
    currency: string;
    condition: string;
    description: string;
    city: string;
    area: string;
    deliveryAvailable: boolean;
    isNegotiable: boolean;
}

const defaultForm: FormState = {
    title: "",
    category: "furniture",
    price: "",
    currency: "USD",
    condition: "good",
    description: "",
    city: "",
    area: "",
    deliveryAvailable: false,
    isNegotiable: true,
};

export default function AgentMarketplaceClient() {
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<MarketplaceItem | null>(null);

    // Form state
    const [form, setForm] = useState<FormState>(defaultForm);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const result = await getAgentMarketplaceItems();
        if (result.success) {
            setItems(result.items as MarketplaceItem[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    function openCreateDialog() {
        setEditingItem(null);
        setForm(defaultForm);
        setError("");
        setDialogOpen(true);
    }

    function openEditDialog(item: MarketplaceItem) {
        setEditingItem(item);
        setForm({
            title: item.title,
            category: item.category,
            price: item.price.toString(),
            currency: item.currency,
            condition: item.condition,
            description: item.description || "",
            city: item.city,
            area: item.area,
            deliveryAvailable: item.delivery_available,
            isNegotiable: item.is_negotiable,
        });
        setError("");
        setDialogOpen(true);
    }

    function openDeleteDialog(item: MarketplaceItem) {
        setDeletingItem(item);
        setDeleteDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = {
            title: form.title,
            category: form.category,
            price: parseFloat(form.price) || 0,
            currency: form.currency,
            condition: form.condition,
            description: form.description,
            city: form.city,
            area: form.area,
            deliveryAvailable: form.deliveryAvailable,
            isNegotiable: form.isNegotiable,
        };

        let result;
        if (editingItem) {
            result = await updateMarketplaceItem({ itemId: editingItem.id, ...payload });
        } else {
            result = await createMarketplaceItem(payload);
        }

        if (result.success) {
            setDialogOpen(false);
            await fetchItems();
        } else {
            setError(result.error || "Something went wrong");
        }

        setSaving(false);
    }

    async function handleDelete() {
        if (!deletingItem) return;
        setSaving(true);
        const result = await deleteMarketplaceItem(deletingItem.id);
        if (result.success) {
            setDeleteDialogOpen(false);
            setDeletingItem(null);
            await fetchItems();
        } else {
            setError(result.error || "Failed to delete");
        }
        setSaving(false);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Marketplace Items</h1>
                    <p className="text-muted-foreground">
                        Manage your household items for the marketplace
                    </p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                </Button>
            </div>

            {/* Items Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : items.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No items yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Start listing household items in the marketplace
                        </p>
                        <Button onClick={openCreateDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Item
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => {
                        const coverPhoto = item.household_item_photos?.find((p) => p.is_cover);
                        const firstPhoto = item.household_item_photos?.[0];
                        const photoUrl = coverPhoto?.url || firstPhoto?.url;

                        return (
                            <Card key={item.id} className="overflow-hidden">
                                {/* Photo */}
                                <div className="aspect-video bg-muted relative">
                                    {photoUrl ? (
                                        <img
                                            src={photoUrl}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Package className="h-10 w-10 text-muted-foreground/40" />
                                        </div>
                                    )}
                                    <Badge
                                        className={`absolute top-2 right-2 ${STATUS_COLORS[item.status] || ""}`}
                                    >
                                        {item.status}
                                    </Badge>
                                </div>

                                <CardContent className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground capitalize">
                                            {item.category.replace("_", " ")} &middot;{" "}
                                            {item.condition.replace("_", " ")}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-lg font-bold">
                                            <DollarSign className="h-4 w-4" />
                                            {item.price.toLocaleString()}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {item.currency}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {item.city}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => openEditDialog(item)}
                                        >
                                            <Pencil className="h-3 w-3 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => openDeleteDialog(item)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogHeader>
                    {editingItem ? "Edit Item" : "Add New Item"}
                </DialogHeader>
                <DialogBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. IKEA KALLAX Shelf Unit"
                                required
                                minLength={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <select
                                    id="category"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    required
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="condition">Condition *</Label>
                                <select
                                    id="condition"
                                    value={form.condition}
                                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    required
                                >
                                    {CONDITIONS.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="price">Price *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="currency">Currency</Label>
                                <select
                                    id="currency"
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="AED">AED</option>
                                    <option value="SAR">SAR</option>
                                    <option value="PKR">PKR</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    placeholder="e.g. Dubai"
                                    required
                                    minLength={2}
                                />
                            </div>
                            <div>
                                <Label htmlFor="area">Area *</Label>
                                <Input
                                    id="area"
                                    value={form.area}
                                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                                    placeholder="e.g. Marina"
                                    required
                                    minLength={2}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe the item's condition, dimensions, etc."
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.deliveryAvailable}
                                    onChange={(e) =>
                                        setForm({ ...form, deliveryAvailable: e.target.checked })
                                    }
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm">Delivery Available</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.isNegotiable}
                                    onChange={(e) =>
                                        setForm({ ...form, isNegotiable: e.target.checked })
                                    }
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm">Negotiable</span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={saving}>
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                {editingItem ? "Save Changes" : "Create Item"}
                            </Button>
                        </div>
                    </form>
                </DialogBody>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogHeader>Delete Item</DialogHeader>
                <DialogBody>
                    <p className="text-muted-foreground mb-4">
                        Are you sure you want to delete{" "}
                        <strong>{deletingItem?.title}</strong>? This action cannot be undone.
                    </p>
                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setDeletingItem(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Delete
                        </Button>
                    </div>
                </DialogBody>
            </Dialog>
        </div>
    );
}
