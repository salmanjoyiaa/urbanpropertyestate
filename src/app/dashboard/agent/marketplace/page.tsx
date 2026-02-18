import { Metadata } from "next";
import AgentMarketplaceClient from "./agent-marketplace-client";

export const metadata: Metadata = {
    title: "Marketplace Items | Agent Dashboard",
    description: "Manage your marketplace listings",
};

export default function AgentMarketplacePage() {
    return <AgentMarketplaceClient />;
}
