import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

// Login rate-limit guard. The browser hits this before signInWithPassword().
// Keyed by IP + email to slow credential-stuffing per account without
// affecting legitimate users on shared NATs.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const body = await request.json().catch(() => ({})) as { email?: string };
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);

  const key = `login:${ip}:${email}`;
  const rl = checkRateLimit(key, LIMITS.login.limit, LIMITS.login.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  return NextResponse.json({ ok: true });
}
