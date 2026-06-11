import { NextRequest, NextResponse } from "next/server";
import { createClient }             from "@/lib/supabase/server";
import { createAdminClient }        from "@/lib/supabase/admin-client";
import { sendTemplatedEmail }       from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { randomBytes }              from "crypto";
import type { UserRole }            from "@/types/auth";
import { SITE_URL }                 from "@/lib/email/client";

// ─── Role mapping ─────────────────────────────────────────────────────────────

const PARTNER_TYPE_ROLE: Record<string, UserRole> = {
  institution:         "institution",
  recruitment_partner: "recruitment_partner",
  employer:            "employer",
};

const PARTNER_TYPE_LABEL: Record<string, string> = {
  institution:         "Institution",
  recruitment_partner: "Recruitment Partner",
  employer:            "Employer",
};

const PORTAL_PATH: Record<string, string> = {
  institution:         "/dashboard/institution",
  recruitment_partner: "/dashboard/partner",
  employer:            "/dashboard/employer",
};

// ─── Password generator ───────────────────────────────────────────────────────

function generateTempPassword(): string {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  const special = "!@#$";
  const all     = upper + lower + digits + special;
  const bytes   = randomBytes(14);
  // Guarantee at least one character from each class
  let pwd =
    upper[bytes[0]  % upper.length]   +
    lower[bytes[1]  % lower.length]   +
    digits[bytes[2] % digits.length]  +
    special[bytes[3]% special.length];
  for (let i = 4; i < 14; i++) {
    pwd += all[bytes[i] % all.length];
  }
  // Shuffle so the guaranteed chars aren't all at the front
  return pwd.split("").sort(() => (randomBytes(1)[0] % 2 === 0 ? 1 : -1)).join("");
}

// ─── POST /api/admin/partner-applications/[id]/approve ───────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`partner-approve:${ip}`, LIMITS.partnerApproval.limit, LIMITS.partnerApproval.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    // ── Authenticate caller as admin ───────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: adminProfile } = await supabase
      .from("profiles").select("role, full_name").eq("id", user.id).single();
    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    let college_id: string | null = null;
    try {
      const body = await request.json() as { college_id?: string | null };
      college_id = body.college_id ?? null;
    } catch { /* empty body is fine for non-institution partners */ }

    // ── Load the partner application ───────────────────────────────────────
    const { data: app, error: appError } = await supabase
      .from("partner_applications")
      .select("id, org_name, contact_name, email, partner_type, status, created_user_id")
      .eq("id", id)
      .single();

    if (appError || !app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    if (app.status === "approved") {
      return NextResponse.json({ error: "Application is already approved" }, { status: 409 });
    }

    const partnerType = app.partner_type as string;
    const role        = PARTNER_TYPE_ROLE[partnerType];
    if (!role) {
      return NextResponse.json({ error: `Unknown partner type: ${partnerType}` }, { status: 400 });
    }

    // Institution approvals require a college to be selected
    if (partnerType === "institution" && !college_id) {
      return NextResponse.json(
        { error: "A college must be selected before approving an institution application." },
        { status: 422 },
      );
    }

    // ── Create auth user via service-role client ───────────────────────────
    const adminDb      = createAdminClient();
    const tempPassword = generateTempPassword();

    const { data: authData, error: createUserError } = await adminDb.auth.admin.createUser({
      email:            app.email,
      password:         tempPassword,
      email_confirm:    true,   // bypass email verification — we're sending credentials directly
      user_metadata:    { full_name: app.contact_name, role, org_name: app.org_name },
    });

    if (createUserError) {
      console.error("[PartnerApprove] createUser error:", createUserError.message);
      // If user already exists, surface a clear error
      if (createUserError.message?.includes("already registered") ||
          createUserError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Check auth.users in Supabase." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: createUserError.message }, { status: 500 });
    }

    const newUserId = authData.user.id;

    // ── Create profile ─────────────────────────────────────────────────────
    const { error: profileError } = await adminDb
      .from("profiles")
      .insert({
        id:         newUserId,
        email:      app.email,
        full_name:  app.contact_name,
        role,
        phone:      null,
        country:    null,
        avatar_url: null,
        college_id: partnerType === "institution" ? college_id : null,
      });

    if (profileError) {
      console.error("[PartnerApprove] profile insert error:", profileError.message);
      // Roll back the created auth user to keep state consistent
      await adminDb.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: `Profile creation failed: ${profileError.message}` }, { status: 500 });
    }

    const now = new Date().toISOString();

    // ── Update partner_application ─────────────────────────────────────────
    await supabase.from("partner_applications").update({
      status:          "approved",
      approved_at:     now,
      approved_by:     user.id,
      created_user_id: newUserId,
    }).eq("id", id);

    // ── Audit log ──────────────────────────────────────────────────────────
    await supabase.from("partner_account_audit_log").insert({
      application_id:  id,
      partner_type:    partnerType,
      action:          "approved",
      created_user_id: newUserId,
      created_by:      user.id,
      notes:           partnerType === "institution" ? `college_id=${college_id ?? "none"}` : null,
    });

    // ── In-app notification for the new partner user ───────────────────────
    await adminDb.from("notifications").insert({
      user_id:        newUserId,
      application_id: null,
      title:          "Welcome to PathPort! 🎉",
      message:        `Your ${PARTNER_TYPE_LABEL[partnerType] ?? partnerType} application has been approved. Login to access your portal.`,
      type:           "system",
    });

    // ── Activation email (non-fatal) ───────────────────────────────────────
    const portalUrl = `${SITE_URL}${PORTAL_PATH[partnerType] ?? "/login"}`;
    await sendTemplatedEmail({
      to:       app.email,
      template: "partner_approved",
      context: {
        name:              app.contact_name,
        partnerType:       PARTNER_TYPE_LABEL[partnerType] ?? partnerType,
        portalUrl:         `${SITE_URL}/login`,
        email:             app.email,
        temporaryPassword: tempPassword,
      },
      userId:   newUserId,
      metadata: { application_id: id, partner_type: partnerType, portal_url: portalUrl },
    });

    console.log("[PartnerApprove] approved:", id, "→ user:", newUserId, "role:", role);
    return NextResponse.json({ success: true, userId: newUserId }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PartnerApprove] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
