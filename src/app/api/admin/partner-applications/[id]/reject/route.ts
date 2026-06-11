import { NextRequest, NextResponse } from "next/server";
import { createClient }             from "@/lib/supabase/server";
import { sendTemplatedEmail }       from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

// ─── POST /api/admin/partner-applications/[id]/reject ────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`partner-reject:${ip}`, LIMITS.partnerApproval.limit, LIMITS.partnerApproval.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    // ── Authenticate caller as admin ───────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: adminProfile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    let rejection_reason: string | null = null;
    try {
      const body = await request.json() as { rejection_reason?: string | null };
      rejection_reason = body.rejection_reason?.trim() || null;
    } catch { /* rejection_reason is optional */ }

    // ── Load the application ───────────────────────────────────────────────
    const { data: app, error: appError } = await supabase
      .from("partner_applications")
      .select("id, org_name, contact_name, email, partner_type, status")
      .eq("id", id)
      .single();

    if (appError || !app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    if (app.status === "rejected") {
      return NextResponse.json({ error: "Application is already rejected" }, { status: 409 });
    }
    if (app.status === "approved") {
      return NextResponse.json({ error: "Cannot reject an already-approved application" }, { status: 409 });
    }

    const now = new Date().toISOString();

    // ── Update partner_application ─────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("partner_applications")
      .update({
        status:           "rejected",
        rejected_at:      now,
        rejected_by:      user.id,
        rejection_reason: rejection_reason,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // ── Audit log ──────────────────────────────────────────────────────────
    await supabase.from("partner_account_audit_log").insert({
      application_id:  id,
      partner_type:    app.partner_type,
      action:          "rejected",
      created_user_id: null,
      created_by:      user.id,
      notes:           rejection_reason,
    });

    // ── Rejection email (non-fatal) ────────────────────────────────────────
    await sendTemplatedEmail({
      to:       app.email,
      template: "partner_rejected",
      context: {
        name:   app.contact_name,
        reason: rejection_reason ?? undefined,
      },
      metadata: { application_id: id, partner_type: app.partner_type },
    });

    console.log("[PartnerReject] rejected:", id, "by:", user.id);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PartnerReject] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
