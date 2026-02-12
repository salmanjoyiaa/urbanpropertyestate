import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        await supabase.auth.signOut();
    } catch {
        // Sign out may throw if session is already expired — that's fine
    }
    return NextResponse.redirect(new URL("/", request.url));
}
