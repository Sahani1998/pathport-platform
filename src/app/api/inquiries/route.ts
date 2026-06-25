import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`inquiry:${ip}`, LIMITS.inquiry.limit, LIMITS.inquiry.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  // CAPTCHA — Cloudflare Turnstile server-side verification
  const turnstileToken = typeof body.cf_turnstile_response === "string" ? body.cf_turnstile_response : null;
  const captcha = await verifyTurnstileToken(turnstileToken, ip ?? undefined);
  if (!captcha.success) {
    return NextResponse.json({ error: captcha.error ?? "CAPTCHA verification failed" }, { status: 400 });
  }

  const fullName = String(body.full_name       ?? "").trim();
  const email    = String(body.email           ?? "").trim().toLowerCase();
  const whatsapp = String(body.whatsapp_number ?? "").trim();
  const country  = String(body.country         ?? "").trim();
  const state    = body.indian_state    ? String(body.indian_state).trim()    : null;
  const city     = body.city            ? String(body.city).trim()            : null;
  const course   = body.course_interest ? String(body.course_interest).trim() : null;
  const intake   = body.intended_intake ? String(body.intended_intake).trim() : null;
  const budget   = body.budget_range    ? String(body.budget_range).trim()    : null;

  if (!fullName) return NextResponse.json({ error: "Full name is required" },    { status: 400 });
  if (!email)    return NextResponse.json({ error: "Email is required" },        { status: 400 });
  if (!country)  return NextResponse.json({ error: "Country is required" },      { status: 400 });
  if (!whatsapp) return NextResponse.json({ error: "WhatsApp number required" }, { status: 400 });

  if (!EMAIL_RE.test(email))
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  if (fullName.length > 100)
    return NextResponse.json({ error: "Name too long" }, { status: 400 });
  if (whatsapp.length > 30)
    return NextResponse.json({ error: "Phone too long" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("student_inquiries")
    .insert({
      full_name:       fullName,
      email,
      whatsapp_number: whatsapp || null,
      country,
      indian_state:    country === "India" ? state : null,
      city,
      course_interest: course,
      intended_intake: intake,
      budget_range:    budget,
      status:          "new",
    });

  if (error) {
    console.error("[Inquiries API] insert error:", error.code, error.message);
    return NextResponse.json({ error: "Failed to submit inquiry. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
