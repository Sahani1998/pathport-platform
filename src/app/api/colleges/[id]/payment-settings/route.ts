// College payment settings — GET + PUT.
//
// Authorization is enforced at two layers:
//   1. API guard rejects unauthenticated requests and non-(institution|admin) roles.
//   2. RLS policies on `college_payment_settings` ensure an institution can only
//      touch their own college (helper `user_owns_college(college_id)`), and that
//      admins can touch any.
//
// PUT upserts on (college_id) so the first save creates the row.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { Currency, CollegePaymentSettings } from "@/types/payment";

const ALLOWED_CURRENCIES: readonly Currency[] = ["SGD", "USD", "INR", "GBP", "EUR", "AUD"];

const EDITABLE_FIELDS = [
  "bank_transfer_enabled",
  "bank_name", "bank_account_name", "bank_account_number",
  "bank_swift_code", "bank_branch_code", "bank_country",
  "bank_currency", "bank_payment_instructions",
  "wise_enabled",
  "wise_recipient_name", "wise_recipient_email",
  "wise_currency", "wise_instructions",
  "finance_contact_name", "finance_email", "finance_phone",
  "finance_whatsapp", "finance_notes",
] as const;
type EditableField = typeof EDITABLE_FIELDS[number];

async function requireInstitutionOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null, forbidden: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return { supabase, user, role: null, forbidden: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase, user, role: profile.role, profileCollegeId: profile.college_id as string | null, forbidden: null };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: collegeId } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`payment-settings-read:${ip}`, LIMITS.paymentSettings.limit, LIMITS.paymentSettings.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, forbidden } = await requireInstitutionOrAdmin();
  if (forbidden) return forbidden;

  // RLS filters this — institution sees only their own row, admin sees all.
  const { data, error } = await supabase
    .from("college_payment_settings")
    .select("*")
    .eq("college_id", collegeId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data as CollegePaymentSettings | null });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: collegeId } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`payment-settings-write:${ip}`, LIMITS.paymentSettings.limit, LIMITS.paymentSettings.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, user, forbidden } = await requireInstitutionOrAdmin();
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const updates: Record<string, unknown> = { college_id: collegeId, updated_by: user!.id };

  for (const field of EDITABLE_FIELDS as readonly EditableField[]) {
    if (!(field in body)) continue;
    const v = body[field];

    if (field === "bank_transfer_enabled" || field === "wise_enabled") {
      updates[field] = Boolean(v);
      continue;
    }

    if (field === "bank_currency" || field === "wise_currency") {
      if (v === null || v === "") { updates[field] = null; continue; }
      if (typeof v !== "string" || !ALLOWED_CURRENCIES.includes(v as Currency)) {
        return NextResponse.json({ error: `Invalid currency for ${field}` }, { status: 400 });
      }
      updates[field] = v;
      continue;
    }

    // All other fields are nullable text — trim and treat empty as null.
    if (v === null || v === undefined) { updates[field] = null; continue; }
    if (typeof v !== "string") {
      return NextResponse.json({ error: `${field} must be a string` }, { status: 400 });
    }
    const trimmed = v.trim();
    updates[field] = trimmed === "" ? null : trimmed;
  }

  // Light semantic validation — block enabling a method without minimum fields.
  if (updates.bank_transfer_enabled === true) {
    if (!updates.bank_name || !updates.bank_account_name || !updates.bank_account_number) {
      return NextResponse.json(
        { error: "Bank transfer requires bank name, account name, and account number." },
        { status: 400 },
      );
    }
  }
  if (updates.wise_enabled === true) {
    if (!updates.wise_recipient_name || !updates.wise_recipient_email) {
      return NextResponse.json(
        { error: "Wise requires recipient name and email." },
        { status: 400 },
      );
    }
  }

  // Upsert by college_id (UNIQUE). RLS enforces ownership.
  const { data, error } = await supabase
    .from("college_payment_settings")
    .upsert(updates, { onConflict: "college_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data as CollegePaymentSettings });
}
