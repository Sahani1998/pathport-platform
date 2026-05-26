import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request.
 * Called from /middleware.ts — keeps the session alive without a full page reload.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Refresh session — IMPORTANT: do not remove this call.
  const { data: { user } } = await supabase.auth.getUser();

  const path        = request.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isAdminDash = path.startsWith("/dashboard/admin");
  const isAuthPage  = path === "/login" || path === "/signup" || path === "/forgot-password";

  console.log("[Middleware] path:", path, "| user:", user ? user.id : "null");

  // Unauthenticated user trying to access dashboard
  if (isDashboard && !user) {
    if (isAdminDash) {
      console.log("[Middleware] REDIRECT → /admin/login (no session, admin path)");
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    console.log("[Middleware] REDIRECT → /login (no session)");
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting public auth pages → go to their dashboard
  if (isAuthPage && user) {
    console.log("[Middleware] REDIRECT → /dashboard (auth user on auth page)");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}
