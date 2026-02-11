import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

export async function GET(request: Request) {
    try {
        const supabase = createClient();
        await supabase.auth.signOut();
    } catch {
        // Gracefully handle expired/missing session
    }
    return NextResponse.redirect(new URL("/", request.url));
}
