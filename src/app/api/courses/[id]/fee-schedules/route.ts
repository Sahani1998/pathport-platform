// Course fee schedule templates — list + create.
//
// RLS handles ownership: institution can only see/create rows on courses
// belonging to their college (via `user_owns_course_college`).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { validateLineItems } from "@/lib/payments/validate-fee-schedule";
import type { CourseFeeSchedule } from "@/types/payment";

async function requireInstitutionOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, forbidden: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return { supabase, user, forbidden: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase, user, forbidden: null };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`fee-schedule-read:${ip}`, LIMITS.feeSchedule.limit, LIMITS.feeSchedule.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, forbidden } = await requireInstitutionOrAdmin();
  if (forbidden) return forbidden;

  const { data, error } = await supabase
    .from("course_fee_schedules")
    .select("*")
    .eq("course_id", courseId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedules: (data ?? []) as CourseFeeSchedule[] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`fee-schedule-write:${ip}`, LIMITS.feeSchedule.limit, LIMITS.feeSchedule.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, user, forbidden } = await requireInstitutionOrAdmin();
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (name.length > 120) return NextResponse.json({ error: "Name too long (max 120 chars)" }, { status: 400 });

  const dueOffsetRaw = Number(body.due_offset_days ?? 14);
  if (!Number.isInteger(dueOffsetRaw) || dueOffsetRaw < 0 || dueOffsetRaw > 365) {
    return NextResponse.json({ error: "due_offset_days must be 0–365" }, { status: 400 });
  }

  const lv = validateLineItems(body.line_items);
  if (!lv.ok) return NextResponse.json({ error: lv.error }, { status: 400 });

  const isDefault = Boolean(body.is_default);

  // If marking new schedule default, clear the existing default first to satisfy
  // the partial unique index `cfs_one_default_per_course`.
  if (isDefault) {
    const { error: clearErr } = await supabase
      .from("course_fee_schedules")
      .update({ is_default: false })
      .eq("course_id", courseId)
      .eq("is_default", true);
    if (clearErr) return NextResponse.json({ error: clearErr.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("course_fee_schedules")
    .insert({
      course_id:       courseId,
      name,
      is_default:      isDefault,
      line_items:      lv.lines,
      due_offset_days: dueOffsetRaw,
      created_by:      user!.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedule: data as CourseFeeSchedule });
}
