import PropertyForm from "@/components/property-form";
import { requireRole } from "@/lib/auth/guards";

export default async function NewPropertyPage() {
    await requireRole(["agent", "admin"]);
    return <PropertyForm />;
}
