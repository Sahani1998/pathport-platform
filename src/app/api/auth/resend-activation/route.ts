import { NextRequest, NextResponse }    from "next/server";
import { createAdminClient }            from "@/lib/supabase/admin-client";
import { sendTemplatedEmail }           from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { SITE_URL }                     from "@/lib/email/client";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`resend-activation:${ip}`, 3, 10 * 60_000); // 3 per 10 min
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    const body = await request.json() as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Verify a profile exists for this email (only approved partners can reactivate)
    const { data: profile } = await adminDb
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    // Always return 200 to avoid email enumeration
    if (!profile) {
      console.log("[ResendActivation] no profile found for:", email);
      return NextResponse.json({ success: true });
    }

    const { data: linkData, error: linkError } = await adminDb.auth.admin.generateLink({
      type:    "invite",
      email,
      options: { redirectTo: `${SITE_URL}/activate-account` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("[ResendActivation] generateLink failed:", linkError?.message);
      return NextResponse.json({ error: "Could not generate activation link." }, { status: 500 });
    }

    const PARTNER_TYPE_LABEL: Record<string, string> = {
      institution:         "Institution",
      recruitment_partner: "Recruitment Partner",
      employer:            "Employer",
    };

    await sendTemplatedEmail({
      to:       email,
      template: "partner_activation",
      context: {
        activationUrl: linkData.properties.action_link,
        partnerType:   PARTNER_TYPE_LABEL[profile.role] ?? profile.role,
      },
      userId:   profile.id,
      metadata: { trigger: "resend_activation" },
    });

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ResendActivation] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
