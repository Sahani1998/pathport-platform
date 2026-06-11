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
  let pwd =
    upper[bytes[0]  % upper.length]   +
    lower[bytes[1]  % lower.length]   +
    digits[bytes[2] % digits.length]  +
    special[bytes[3]% special.length];
  for (let i = 4; i < 14; i++) pwd += all[bytes[i] % all.length];
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
    let college_id:       string | null = null;
    let new_college_name: string | null = null;
    try {
      const body = await request.json() as { college_id?: string | null; new_college_name?: string | null };
      college_id       = body.college_id       ?? null;
      new_college_name = body.new_college_name ?? null;
    } catch { /* empty body is fine for non-institution partners */ }

    // ── Load the partner application ───────────────────────────────────────
    const { data: app, error: appError } = await supabase
      .from("partner_applications")
      .select("id, org_name, contact_name, email, partner_type, status, created_user_id, country, website, message")
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

    if (partnerType === "institution" && !college_id && !new_college_name) {
      return NextResponse.json(
        { error: "A college must be selected or a new college name provided before approving an institution application." },
        { status: 422 },
      );
    }

    const adminDb = createAdminClient();

    // ── Create new college if requested ───────────────────────────────────
    if (partnerType === "institution" && new_college_name) {
      const baseName = new_college_name.trim();
      let slug       = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      let suffix = 1, uniqueSlug = slug;
      while (true) {
        const { data: existing } = await adminDb
          .from("colleges").select("id").eq("slug", uniqueSlug).maybeSingle();
        if (!existing) break;
        suffix++;
        uniqueSlug = `${slug}-${suffix}`;
      }

      const { data: newCollege, error: collegeError } = await adminDb
        .from("colleges")
        .insert({
          name:        baseName,
          slug:        uniqueSlug,
          country:     (app as Record<string, unknown>).country as string ?? null,
          website:     (app as Record<string, unknown>).website as string ?? null,
          description: (app as Record<string, unknown>).message as string ?? null,
          is_active:   true,
        })
        .select("id")
        .single();

      if (collegeError || !newCollege) {
        console.error("[PartnerApprove] college create error:", collegeError?.message);
        return NextResponse.json(
          { error: `Failed to create college: ${collegeError?.message ?? "unknown error"}` },
          { status: 500 },
        );
      }

      college_id = newCollege.id as string;
    }

    // ── Resolve auth user (idempotent) ────────────────────────────────────
    //
    // Execution order:
    //   1. If the application already has a created_user_id, reuse it.
    //   2. Otherwise look up an existing profile row by email — reuse that ID.
    //   3. Otherwise create a new auth user.
    //      Note: the on_auth_user_created trigger fires synchronously and
    //      inserts a profile row immediately, so the explicit insert below
    //      would duplicate — we use upsert instead.
    //
    let resolvedUserId:  string;
    let tempPassword:    string | null = null;
    let createdNewUser   = false;

    const linkedUserId = (app as Record<string, unknown>).created_user_id as string | null;

    if (linkedUserId) {
      // Previous approval already linked a user — reuse.
      console.log("[PartnerApprove] auth: reusing linked user id:", linkedUserId);
      resolvedUserId = linkedUserId;

    } else {
      // Check whether a profile already exists for this email.
      const { data: existingProfile, error: profileLookupError } = await adminDb
        .from("profiles")
        .select("id")
        .eq("email", app.email)
        .maybeSingle();

      console.log("[PartnerApprove] profile lookup by email:", {
        email:  app.email,
        found:  !!existingProfile,
        id:     existingProfile?.id ?? null,
        error:  profileLookupError?.message ?? null,
      });

      if (existingProfile?.id) {
        // Profile (and therefore auth user) already exists — reuse.
        console.log("[PartnerApprove] existing profile found, reusing id:", existingProfile.id);
        resolvedUserId = existingProfile.id as string;

      } else {
        // No existing user — create one.
        tempPassword = generateTempPassword();
        console.log("[PartnerApprove] creating new auth user for:", app.email);

        const { data: authData, error: createUserError } = await adminDb.auth.admin.createUser({
          email:         app.email,
          password:      tempPassword,
          email_confirm: true,
          user_metadata: { full_name: app.contact_name, role, org_name: app.org_name },
        });

        console.log("[PartnerApprove] createUser result:", {
          success: !createUserError,
          userId:  authData?.user?.id ?? null,
          error:   createUserError?.message ?? null,
        });

        if (createUserError) {
          // "Already registered" means auth user exists but profile lookup missed it
          // (possible trigger failure on a previous attempt). Try profile table again.
          if (
            createUserError.message?.includes("already registered") ||
            createUserError.message?.includes("already been registered")
          ) {
            const { data: fallbackProfile } = await adminDb
              .from("profiles")
              .select("id")
              .eq("email", app.email)
              .maybeSingle();

            console.log("[PartnerApprove] fallback profile lookup:", {
              found: !!fallbackProfile,
              id:    fallbackProfile?.id ?? null,
            });

            if (fallbackProfile?.id) {
              resolvedUserId = fallbackProfile.id as string;
            } else {
              return NextResponse.json(
                { error: "An auth account exists for this email but the profile could not be located. Check Supabase Auth → Users." },
                { status: 409 },
              );
            }
          } else {
            return NextResponse.json({ error: createUserError.message }, { status: 500 });
          }
        } else {
          resolvedUserId = authData.user.id;
          createdNewUser  = true;
        }
      }
    }

    // ── Upsert profile ─────────────────────────────────────────────────────
    //
    // The on_auth_user_created trigger creates a profile row synchronously
    // when a new auth user is inserted. We upsert here so that:
    //   - New users: trigger already created the row → we update role + college_id.
    //   - Existing users (retry): profile exists → we update role + college_id.
    //   - Edge case (trigger missed): no row → we insert it.
    //
    // Only: id, email, full_name, role, college_id — the five columns that
    // exist in production profiles. Nothing else.
    //
    const profilePayload = {
      id:         resolvedUserId,
      email:      app.email,
      full_name:  app.contact_name,
      role,
      college_id: partnerType === "institution" ? college_id : null,
    };

    console.log("[PartnerApprove] upserting profile:", profilePayload);

    const { error: profileError } = await adminDb
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    console.log("[PartnerApprove] profile upsert result:", {
      success: !profileError,
      error:   profileError?.message ?? null,
    });

    if (profileError) {
      console.error("[PartnerApprove] profile upsert failed:", profileError.message);
      // Only roll back auth user if we just created it (don't touch existing accounts).
      if (createdNewUser) {
        await adminDb.auth.admin.deleteUser(resolvedUserId);
        console.log("[PartnerApprove] rolled back new auth user:", resolvedUserId);
      }
      return NextResponse.json({ error: `Profile upsert failed: ${profileError.message}` }, { status: 500 });
    }

    const now = new Date().toISOString();

    // ── Mark application approved ──────────────────────────────────────────
    await supabase.from("partner_applications").update({
      status:          "approved",
      approved_at:     now,
      approved_by:     user.id,
      created_user_id: resolvedUserId,
    }).eq("id", id);

    // ── Audit log ──────────────────────────────────────────────────────────
    await supabase.from("partner_account_audit_log").insert({
      application_id:  id,
      partner_type:    partnerType,
      action:          "approved",
      created_user_id: resolvedUserId,
      created_by:      user.id,
      notes:           partnerType === "institution"
        ? (new_college_name
          ? `created college "${new_college_name.trim()}" (id=${college_id})`
          : `college_id=${college_id ?? "none"}`)
        : null,
    });

    // ── In-app notification for the partner user ───────────────────────────
    await adminDb.from("notifications").insert({
      user_id:        resolvedUserId,
      application_id: null,
      title:          "Welcome to PathPort! 🎉",
      message:        `Your ${PARTNER_TYPE_LABEL[partnerType] ?? partnerType} application has been approved. Login to access your portal.`,
      type:           "system",
    });

    // ── Activation email (non-fatal; skipped if no temp password) ─────────
    if (tempPassword) {
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
        userId:   resolvedUserId,
        metadata: { application_id: id, partner_type: partnerType, portal_url: portalUrl },
      });
    } else {
      console.log("[PartnerApprove] skipping activation email — existing user, password unknown");
    }

    console.log("[PartnerApprove] success:", { applicationId: id, userId: resolvedUserId, role, createdNewUser });
    return NextResponse.json({ success: true, userId: resolvedUserId }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PartnerApprove] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
