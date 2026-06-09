import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Stages from which withdrawal is allowed
const WITHDRAWABLE_STAGES = new Set([
  "application_submitted",
  "documents_pending",
  "documents_uploaded",
  "documents_under_review",
  "documents_verified",
  "offer_letter_processing",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`withdraw:${ip}`, 5, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership and current stage
  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id, current_stage")
    .eq("id", id)
    .single();

  if (!app)                    return NextResponse.json({ error: "Not found" },  { status: 404 });
  if (app.student_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const stage = (app.current_stage ?? "application_submitted") as string;
  if (!WITHDRAWABLE_STAGES.has(stage)) {
    return NextResponse.json(
      { error: "This application cannot be withdrawn at its current stage" },
      { status: 400 },
    );
  }

  // Update stage + status
  const { error: updateErr } = await supabase
    .from("applications")
    .update({
      current_stage:    "withdrawn",
      status:           "rejected",
      stage_updated_at: new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Timeline event + notification (non-fatal)
  await Promise.allSettled([
    supabase.from("application_timeline_events").insert({
      application_id:     id,
      stage:              "withdrawn",
      title:              "Application Withdrawn",
      description:        "Student withdrew the application.",
      created_by:         user.id,
      created_by_role:    "student",
      visible_to_student: true,
    }),
    supabase.from("notifications").insert({
      user_id:        user.id,
      application_id: id,
      title:          "Application Withdrawn",
      message:        "Your application has been successfully withdrawn.",
      type:           "application_update",
    }),
  ]);

  return NextResponse.json({ success: true });
}
