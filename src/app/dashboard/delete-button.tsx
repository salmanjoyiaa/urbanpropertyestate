"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function DeletePropertyButton({
    propertyId,
}: {
    propertyId: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this property?")) return;

        setLoading(true);
        const supabase = createClient();

        // Delete photos, blocks, and property
        await supabase.from("property_photos").delete().eq("property_id", propertyId);
        await supabase.from("property_blocks").delete().eq("property_id", propertyId);
        await supabase.from("properties").delete().eq("id", propertyId);

        router.refresh();
        setLoading(false);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            className="text-destructive hover:text-destructive"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
