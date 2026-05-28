import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = [
  "submitted", "under_review", "docs_required",
  "offer_ready", "ipa_processing", "approved", "rejected",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("[Timeline API] PATCH /api/applications/", id, "/status — request received");

  try {
    // ── Parse body ──────────────────────────────────────────────────────────
    let status: string;
    try {
      const body = await request.json() as { status?: string };
      status = body.status ?? "";
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[Timeline API] user loaded — id:", user?.id ?? "null", "| error:", authError?.message ?? "none");

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Role check ───────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles").select("role, college_id").eq("id", user.id).single();

    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    console.log("[Timeline API] permission checked — role:", profile.role);

    // ── Fetch application ────────────────────────────────────────────────────
    const { data: app, error: appError } = await supabase
      .from("applications").select("id, student_id, course_id").eq("id", id).single();

    if (appError || !app) {
      console.error("[Timeline API] application not found:", appError?.message);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // ── Institution ownership check ──────────────────────────────────────────
    if (profile.role === "institution" && profile.college_id) {
      const { data: course } = await supabase
        .from("courses").select("college_id").eq("id", app.course_id).single();
      if (!course || course.college_id !== profile.college_id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // ── Update status ────────────────────────────────────────────────────────
    console.log("[Timeline API] updating status:", id, "→", status);

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      console.error("[Timeline API] update error:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("[Timeline API] application updated successfully");

    // ── Optional notification for key statuses ───────────────────────────────
    const NOTIFY: Record<string, { title: string; message: string }> = {
      offer_ready:    { title: "Offer Letter Ready 📩",   message: "Your offer letter is ready. Please review it." },
      approved:       { title: "Application Approved! 🎉", message: "Congratulations! Your application has been approved." },
      docs_required:  { title: "Documents Required 📎",   message: "Additional documents are needed. Please upload them." },
      ipa_processing: { title: "IPA Processing Started 🪪", message: "Your IPA is being processed by ICA Singapore." },
    };

    const notif = NOTIFY[status];
    if (notif) {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id:        app.student_id,
        application_id: id,
        title:          notif.title,
        message:        notif.message,
        type:           "application_update",
      });
      if (notifError) {
        console.error("[Timeline API] notification error (non-fatal):", notifError.message);
      } else {
        console.log("[Timeline API] notification created for student:", app.student_id);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Timeline API] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
