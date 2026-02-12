"use client";

import ConversationalSearch from "@/components/conversational-search";

export default function AISearchSection() {
    return (
        <div className="mb-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 border border-primary/10">
            <ConversationalSearch />
        </div>
    );
}
