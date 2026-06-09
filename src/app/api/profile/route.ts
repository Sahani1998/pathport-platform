import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Field validation for PATCH /api/profile.
// Trims strings, coerces empty strings to null. Validates required + format.

const STRING_FIELDS = [
  "full_name", "phone", "country",
  "nationality", "passport_number", "passport_country",
  "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship",
] as const;

const DATE_FIELDS = ["date_of_birth", "passport_expiry"] as const;

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length === 0 ? null : v;
}

function validDateOrNull(value: unknown): string | null | { error: string } {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return { error: "Invalid date format" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { error: "Invalid date" };
  return value.slice(0, 10);
}

export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`profile:${ip}`, 10, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const updates: Record<string, string | null> = {};

  for (const field of STRING_FIELDS) {
    if (field in body) updates[field] = trimOrNull(body[field]);
  }
  for (const field of DATE_FIELDS) {
    if (field in body) {
      const parsed = validDateOrNull(body[field]);
      if (parsed && typeof parsed === "object" && "error" in parsed) {
        return NextResponse.json({ error: `${field}: ${parsed.error}` }, { status: 400 });
      }
      updates[field] = parsed as string | null;
    }
  }

  // Validation
  if ("full_name" in updates) {
    if (!updates.full_name) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    if (updates.full_name.length < 2 || updates.full_name.length > 100) {
      return NextResponse.json({ error: "Name must be 2–100 characters" }, { status: 400 });
    }
  }
  if (updates.phone && updates.phone.length > 30) {
    return NextResponse.json({ error: "Phone too long" }, { status: 400 });
  }
  if (updates.passport_number && !/^[A-Z0-9]{5,20}$/i.test(updates.passport_number)) {
    return NextResponse.json({ error: "Invalid passport number format" }, { status: 400 });
  }
  if (updates.passport_expiry) {
    const expiry = new Date(updates.passport_expiry);
    if (expiry < new Date()) {
      return NextResponse.json({ error: "Passport expiry must be in the future" }, { status: 400 });
    }
  }
  if (updates.date_of_birth) {
    const dob = new Date(updates.date_of_birth);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    if (age < 14 || age > 100) {
      return NextResponse.json({ error: "Date of birth out of range" }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
