import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return supabaseResponse;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Protect all dashboard routes — require authentication
    if (!user && pathname.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Role-based routing for dashboard sub-paths
    if (user && pathname.startsWith("/dashboard")) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const role = profile?.role || "customer";

        // Customers can't access any dashboard
        if (role === "customer") {
            const url = request.nextUrl.clone();
            url.pathname = "/";
            return NextResponse.redirect(url);
        }

        // Agents can't access admin routes
        if (role === "agent" && pathname.startsWith("/dashboard/admin")) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard/agent";
            return NextResponse.redirect(url);
        }

        // Agents can only access their property dashboard, availability, and leads
        if (role === "agent") {
            const allowedAgentRoutes = [
                "/dashboard",
                "/dashboard/agent",
                "/dashboard/leads",
                "/dashboard/properties/new",
                "/dashboard/agent/availability",
            ];

            const isAllowedAgentRoute =
                allowedAgentRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
                pathname.startsWith("/dashboard/properties/");

            if (!isAllowedAgentRoute) {
                const url = request.nextUrl.clone();
                url.pathname = "/dashboard/leads";
                return NextResponse.redirect(url);
            }
        }

        // Redirect base /dashboard to role-specific dashboard
        if (pathname === "/dashboard" || pathname === "/dashboard/") {
            if (role === "admin") {
                const url = request.nextUrl.clone();
                url.pathname = "/dashboard/admin";
                return NextResponse.redirect(url);
            }
        }
    }

    return supabaseResponse;
}
