import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PropertyForm from "@/components/property-form";
import type { Property, PropertyPhoto, PropertyBlock } from "@/lib/types";

interface Props {
    params: { id: string };
}

export default async function EditPropertyPage({ params }: Props) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "admin";

    const propertyQuery = supabase
        .from("properties")
        .select("*")
        .eq("id", params.id);

    if (!isAdmin) {
        propertyQuery.eq("agent_id", user.id);
    }

    const { data: property } = await propertyQuery.single();

    if (!property) notFound();

    const { data: photos } = await supabase
        .from("property_photos")
        .select("*")
        .eq("property_id", params.id)
        .order("position");

    const { data: blocks } = await supabase
        .from("property_blocks")
        .select("*")
        .eq("property_id", params.id)
        .order("start_date");

    return (
        <PropertyForm
            property={property as Property}
            photos={(photos as PropertyPhoto[]) || []}
            blocks={(blocks as PropertyBlock[]) || []}
        />
    );
}
