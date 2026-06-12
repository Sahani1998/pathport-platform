import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Server-side sign-out.
 *
 * Why this endpoint exists:
 *   Client-side `supabase.auth.signOut()` only clears the JWT from
 *   localStorage and may not delete the SSR cookie that Next.js middleware
 *   writes.  Result: after logout the cookie persists and the next request
 *   re-authenticates as the previous user.
 *
 * This endpoint runs server-side with the cookie-aware Supabase client so
 * the signOut call is routed through the cookie adapter — every `sb-*`
 * cookie gets deleted at the HTTP layer.  We then return a JSON response;
 * the client follows up with a hard navigation.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`signout:${ip}`, 20, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();

  // scope: "global" invalidates the JWT across every device / tab.
  // Without it, the access token would still be valid until expiry on other
  // devices even after we clear the local session.
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    console.error("[Auth] server signOut error:", error.message);
  }

  // Defensive: explicitly nuke any leftover sb-* cookies in case the
  // adapter missed one (older cookie shapes from a previous session).
  const cookieStore = await cookies();
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-") || c.name.startsWith("supabase-")) {
      cookieStore.set(c.name, "", { maxAge: 0, path: "/" });
    }
  }

  return NextResponse.json({ ok: true });
}
