import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/application-timeline";

async function requireInstitution() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, college_id")
    .eq("id", user.id)
    .single();
  if (!profile || !["institution","admin"].includes(profile.role)) return { error: "Forbidden", status: 403 };
  return { user, profile };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.stage.limit, LIMITS.stage.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireInstitution();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const action = body.action as string | undefined;
  if (!action || !["suspend","resume"].includes(action)) {
    return NextResponse.json({ error: "action must be 'suspend' or 'resume'" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: existing } = await db.from("internship_eligibility").select("id, student_id, application_id, status").eq("id", id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  let patch: Record<string, unknown>;
  let notifTitle: string;
  let notifMessage: string;

  if (action === "suspend") {
    if (existing.status !== "eligible") return NextResponse.json({ error: "Only eligible students can be suspended" }, { status: 409 });
    const reason = body.suspension_reason as string | null ?? null;
    patch = {
      status:            "suspended",
      suspended_at:      now,
      suspended_by:      user.id,
      suspension_reason: reason,
    };
    notifTitle   = "Internship Access Suspended";
    notifMessage = reason
      ? `Your internship access has been temporarily suspended. Reason: ${reason}. Please contact your institution.`
      : "Your internship access has been temporarily suspended. Please contact your institution.";
  } else {
    if (existing.status !== "suspended") return NextResponse.json({ error: "Only suspended students can be resumed" }, { status: 409 });
    patch = {
      status:            "eligible",
      enabled_at:        now,
      enabled_by:        user.id,
      suspended_at:      null,
      suspended_by:      null,
      suspension_reason: null,
    };
    notifTitle   = "Internship Access Restored 💼";
    notifMessage = "Your internship access has been restored. You can now browse and apply for internship placements again.";
  }

  const { data, error } = await db
    .from("internship_eligibility")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await notifyUser(db, {
    userId:        existing.student_id,
    applicationId: existing.application_id ?? undefined,
    title:         notifTitle,
    message:       notifMessage,
    type:          "system",
  });

  return NextResponse.json({ eligibility: data });
}
