import HouseholdItemForm from "@/components/household-item-form";
import { requireAdmin } from "@/lib/auth/guards";

export default async function NewItemPage() {
    await requireAdmin();

    return (
        <div>
            <h1 className="font-display text-3xl font-bold mb-6">Add Marketplace Item</h1>
            <HouseholdItemForm />
        </div>
    );
}
