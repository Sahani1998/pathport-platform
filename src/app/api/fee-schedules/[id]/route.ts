// Fee schedule — single-row PATCH + DELETE.
//
// Authorization: institution can only touch rows belonging to a course at their
// college; admin can touch any. RLS enforces this via `user_owns_course_college`.

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
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return { supabase, user, forbidden: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase, user, forbidden: null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: scheduleId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`fee-schedule-write:${ip}`, LIMITS.feeSchedule.limit, LIMITS.feeSchedule.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, forbidden } = await requireInstitutionOrAdmin();
  if (forbidden) return forbidden;

  // Load the row first so we know the course_id for the default-clear step.
  // RLS guarantees we can only see rows we own.
  const { data: existing, error: loadErr } = await supabase
    .from("course_fee_schedules")
    .select("id, course_id, is_default")
    .eq("id", scheduleId)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    if (v.length > 120) return NextResponse.json({ error: "Name too long (max 120 chars)" }, { status: 400 });
    updates.name = v;
  }
  if (body.due_offset_days !== undefined) {
    const n = Number(body.due_offset_days);
    if (!Number.isInteger(n) || n < 0 || n > 365) {
      return NextResponse.json({ error: "due_offset_days must be 0–365" }, { status: 400 });
    }
    updates.due_offset_days = n;
  }
  if (body.line_items !== undefined) {
    const lv = validateLineItems(body.line_items);
    if (!lv.ok) return NextResponse.json({ error: lv.error }, { status: 400 });
    updates.line_items = lv.lines;
  }

  // is_default handling — if turning this row into default, clear sibling default first.
  if (body.is_default !== undefined) {
    const next = Boolean(body.is_default);
    if (next && !existing.is_default) {
      const { error: clearErr } = await supabase
        .from("course_fee_schedules")
        .update({ is_default: false })
        .eq("course_id", existing.course_id)
        .eq("is_default", true);
      if (clearErr) return NextResponse.json({ error: clearErr.message }, { status: 500 });
    }
    updates.is_default = next;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("course_fee_schedules")
    .update(updates)
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedule: data as CourseFeeSchedule });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: scheduleId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`fee-schedule-write:${ip}`, LIMITS.feeSchedule.limit, LIMITS.feeSchedule.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, forbidden } = await requireInstitutionOrAdmin();
  if (forbidden) return forbidden;

  const { error } = await supabase
    .from("course_fee_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
