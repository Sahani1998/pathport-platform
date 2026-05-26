import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ── Env diagnostics ───────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL    ?? "MISSING";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "MISSING";

  if (supabaseUrl === "MISSING" || supabaseKey === "MISSING") {
    console.error(
      "[Middleware] ❌ Env vars missing — add NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Project → Settings → Environment Variables"
    );
  }

  console.log("[Middleware] SUPABASE_URL:", supabaseUrl);
  console.log("[Middleware] ANON_KEY prefix:", supabaseKey.slice(0, 15));

  // ── Supabase client ───────────────────────────────────────────────────────
  // Uses the individual get/set/remove adapter so Supabase calls
  // request.cookies.get(name)?.value directly — no batch-search mismatch.
  //
  // set/remove write to BOTH:
  //   1. request.cookies  → downstream server components see the new value
  //   2. supabaseResponse.cookies → browser receives the Set-Cookie header
  //
  // supabaseResponse is re-created from the mutated request after each write
  // so Next.js propagates the updated cookie headers to the route handler.

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      // ── READ ─────────────────────────────────────────────────────────────
      get(name: string) {
        return request.cookies.get(name)?.value;
      },

      // ── WRITE (token refresh / sign-in) ───────────────────────────────────
      set(name: string, value: string, options: Record<string, unknown>) {
        // RequestCookies.set only accepts name + value (no attributes)
        request.cookies.set(name, value);

        // Recreate response from the now-mutated request so Next.js
        // forwards the updated cookie to server components via cookies()
        supabaseResponse = NextResponse.next({ request });

        // ResponseCookies.set accepts full attributes (maxAge, path, sameSite…)
        supabaseResponse.cookies.set(
          name,
          value,
          options as Parameters<typeof supabaseResponse.cookies.set>[2]
        );
      },

      // ── DELETE (sign-out) ─────────────────────────────────────────────────
      remove(name: string, options: Record<string, unknown>) {
        request.cookies.set(name, "");

        supabaseResponse = NextResponse.next({ request });

        supabaseResponse.cookies.set(
          name,
          "",
          options as Parameters<typeof supabaseResponse.cookies.set>[2]
        );
      },
    },
  });

  // ── IMPORTANT: nothing between createServerClient and getUser() ───────────
  const {
    data:  { user },
    error: userError,
  } = await supabase.auth.getUser();

  // ── Cookie diagnostics ────────────────────────────────────────────────────
  const allCookies  = request.cookies.getAll();
  const authCookies = allCookies.filter(
    c => c.name.includes("sb-") || c.name.includes("supabase")
  );

  console.log(
    "[Middleware] path:",       request.nextUrl.pathname,
    "| user:",                  user       ? user.id          : "null",
    "| userError:",             userError  ? userError.message : "none",
    "| cookies total:",         allCookies.length,
    "| auth cookies:",          authCookies.map(c => `${c.name}(${c.value.length}ch)`).join(", ") || "NONE"
  );

  // ── Route guards ──────────────────────────────────────────────────────────
  const path        = request.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isAdminDash = path.startsWith("/dashboard/admin");
  const isAuthPage  =
    path === "/login" ||
    path === "/signup" ||
    path === "/forgot-password";

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

  if (isAuthPage && user) {
    console.log("[Middleware] REDIRECT → /dashboard (auth user on auth page)");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}
