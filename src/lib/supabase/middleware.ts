import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ── Env var guard ─────────────────────────────────────────────────────────
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error(
      "[Middleware] ❌ NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. " +
      "Add them to Vercel → Project → Settings → Environment Variables."
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read all cookies from the incoming request
        getAll() {
          return request.cookies.getAll();
        },

        // Write refreshed session cookies back to both the request AND the
        // response so server components further down the chain see them.
        //
        // CRITICAL: use REST spread  { name, value, ...options }  NOT the
        // explicit destructure  { name, value, options }
        //
        // Supabase passes cookie attributes (maxAge, path, sameSite, secure…)
        // as TOP-LEVEL properties on each item — there is no nested "options"
        // key.  The explicit destructure always produces `options = undefined`,
        // so cookies are written without any attributes, Vercel strips them,
        // and the session is never seen server-side.
        setAll(
          cookiesToSet: Array<{ name: string; value: string; [key: string]: unknown }>
        ) {
          // Propagate into the mutated request so later middleware/layout reads work
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Re-create the response from the updated request
          supabaseResponse = NextResponse.next({ request });

          // Write cookies (with all attributes) onto the HTTP response
          cookiesToSet.forEach(({ name, value, ...options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  // ── Session refresh ───────────────────────────────────────────────────────
  // Do NOT add any logic between createServerClient and getUser().
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // ── Debug logging (Vercel → Functions → Runtime Logs) ────────────────────
  const allCookies  = request.cookies.getAll();
  const authCookies = allCookies.filter(c => c.name.includes("sb-") || c.name.includes("supabase"));

  console.log(
    "[Middleware] path:", request.nextUrl.pathname,
    "| user:", user ? user.id : "null",
    "| cookies total:", allCookies.length,
    "| auth cookies:", authCookies.map(c => c.name).join(", ") || "NONE",
    "| userError:", userError?.message ?? "none"
  );

  // ── Route guards ──────────────────────────────────────────────────────────
  const path        = request.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isAdminDash = path.startsWith("/dashboard/admin");
  const isAuthPage  = path === "/login" || path === "/signup" || path === "/forgot-password";

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
