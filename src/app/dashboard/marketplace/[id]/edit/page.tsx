import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HouseholdItemForm from "@/components/household-item-form";
import type { HouseholdItem, HouseholdItemPhoto } from "@/lib/types";
import { requireAdmin } from "@/lib/auth/guards";

export default async function EditItemPage({ params }: { params: { id: string } }) {
    await requireAdmin();
    const supabase = createClient();

    const { data: item } = await supabase
        .from("household_items")
        .select("*")
        .eq("id", params.id)
        .single();

    if (!item) notFound();

    const { data: photos } = await supabase
        .from("household_item_photos")
        .select("*")
        .eq("item_id", params.id)
        .order("position");

    return (
        <div>
            <h1 className="font-display text-3xl font-bold mb-6">Edit Item</h1>
            <HouseholdItemForm item={item as HouseholdItem} photos={(photos as HouseholdItemPhoto[]) || []} />
        </div>
    );
}
