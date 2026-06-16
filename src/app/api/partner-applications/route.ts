import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PARTNER_TYPES = ["institution", "recruitment_partner", "employer"] as const;
type PartnerType = typeof PARTNER_TYPES[number];

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`partner-apply:${ip}`, LIMITS.partnerApply.limit, LIMITS.partnerApply.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const orgName     = String(body.org_name     ?? "").trim();
  const contactName = String(body.contact_name ?? "").trim();
  const email       = String(body.email        ?? "").trim().toLowerCase();
  const partnerType = String(body.partner_type ?? "").trim();
  const phone       = body.phone   ? String(body.phone).trim()   : null;
  const country     = body.country ? String(body.country).trim() : null;
  const website     = body.website ? String(body.website).trim() : null;
  const message     = body.message ? String(body.message).trim() : null;

  if (!orgName)     return NextResponse.json({ error: "Organisation name is required" }, { status: 400 });
  if (!contactName) return NextResponse.json({ error: "Contact name is required" },      { status: 400 });
  if (!email)       return NextResponse.json({ error: "Email is required" },              { status: 400 });
  if (!EMAIL_RE.test(email))
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  if (!PARTNER_TYPES.includes(partnerType as PartnerType))
    return NextResponse.json({ error: "Invalid partner type" }, { status: 400 });
  if (orgName.length > 200)
    return NextResponse.json({ error: "Organisation name too long" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("partner_applications").insert({
    org_name:     orgName,
    contact_name: contactName,
    email,
    phone,
    partner_type: partnerType as PartnerType,
    country,
    website:      website || null,
    message:      message || null,
    status:       "pending",
  });

  if (error) {
    console.error("[Partner Applications API] insert error:", error.code, error.message);
    return NextResponse.json({ error: "Failed to submit application. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
