import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/application-timeline";

// ─── POST /api/applications/[id]/restore ─────────────────────────────────────
// Institution/admin restores an archived application to the active queue.
// Clears `archived_at`, `archived_by`, `archive_reason`, and `outcome`.
// Sets `restored_at` + `restored_by` for the audit chain.
//
// Security: institution-scoped; students cannot restore.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`app-archive:${ip}`, LIMITS.appArchive.limit, LIMITS.appArchive.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (!profile || !["admin", "institution"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id, course_id, current_stage, archived_at, outcome, courses (college_id, title)")
    .eq("id", id)
    .single();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  type RawCourse = { college_id: string; title: string };
  const rawCourse = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;

  if (profile.role === "institution" && rawCourse?.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (!app.archived_at) {
    return NextResponse.json({ error: "Application is not archived" }, { status: 409 });
  }

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from("applications")
    .update({
      outcome:        null,
      archived_at:    null,
      archived_by:    null,
      archive_reason: null,
      restored_at:    now,
      restored_by:    user.id,
    })
    .eq("id", id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await logAudit(supabase, {
    applicationId: id,
    actorId:       user.id,
    actorRole:     profile.role,
    action:        "application_restored",
    fromValue:     String(app.outcome ?? "archived"),
    toValue:       "active",
    metadata:      { course_title: rawCourse?.title ?? null },
  });

  return NextResponse.json({ success: true, restored_at: now });
}
