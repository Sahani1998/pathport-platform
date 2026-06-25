import { getEmailClient, FROM_ADDRESS } from "./client";
import { renderTemplate, type EmailTemplate, type TemplateContext } from "./templates";
import { createClient } from "@/lib/supabase/server";
import { signUnsubscribeToken } from "@/lib/unsubscribe-token";

// ─── Centralized send + log ───────────────────────────────────────────────────
//
// Every email goes through sendTemplatedEmail() — it renders the template,
// inserts a row into email_log (status=queued), attempts delivery, then
// updates the row with sent / failed status. Non-fatal: caller never sees
// throws; failures are logged for retry by a future worker.

interface SendOptions {
  to:             string;
  template:       EmailTemplate;
  context:        TemplateContext;
  applicationId?: string | null;
  userId?:        string | null;
  metadata?:      Record<string, unknown>;
}

export interface SendResult {
  success: boolean;
  logId?:  string;
  error?:  string;
}

export async function sendTemplatedEmail(opts: SendOptions): Promise<SendResult> {
  const { to, template, context, applicationId, userId, metadata } = opts;

  // Bounce / complaint suppression check before ANY other work.
  // Profiles with do_not_contact=true are never emailed again.
  const supabase = await createClient();
  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("do_not_contact")
    .eq("email", to.toLowerCase().trim())
    .maybeSingle();
  if (profileCheck?.do_not_contact) {
    console.info(`[Email] suppressed ${template} → ${to} (do_not_contact)`);
    return { success: false, error: "suppressed:do_not_contact" };
  }

  const rendered = renderTemplate(template, context);

  // Insert log row in queued state
  const { data: logRow } = await supabase
    .from("email_log")
    .insert({
      to_email:       to,
      template,
      subject:        rendered.subject,
      status:         "queued",
      application_id: applicationId ?? null,
      user_id:        userId        ?? null,
      metadata:       metadata      ?? null,
    })
    .select("id")
    .single();

  const logId = logRow?.id as string | undefined;

  const resend = getEmailClient();
  if (!resend) {
    if (logId) {
      await supabase
        .from("email_log")
        .update({ status: "skipped", error_message: "RESEND_API_KEY not configured" })
        .eq("id", logId);
    }
    console.warn("[Email] RESEND_API_KEY not set — skipped", template, "→", to);
    return { success: false, logId, error: "Email service not configured" };
  }

  try {
    console.log("[Email] sending:", {
      template,
      to,
      from:               FROM_ADDRESS,
      RESEND_FROM_EMAIL:  process.env.RESEND_FROM_EMAIL ?? "(not set — using default noreply@pathport.sg)",
      RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
      subject:            rendered.subject,
      logId,
    });

    // Resend v6 never throws on API errors — it returns { data, error }.
    // The error branch must be checked explicitly or failures are silent.
    // Issue an HMAC-signed unsubscribe token so the one-click POST link
    // cannot be tampered with. If EMAIL_UNSUBSCRIBE_SECRET is not set we
    // fall back to the unsigned link (server will refuse it, but the email
    // still sends — better than blocking notifications).
    let unsubscribeUrl: string;
    try {
      const tok = await signUnsubscribeToken(to, Date.now());
      unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://pathport.sg"}/unsubscribe?token=${encodeURIComponent(tok)}&email=${encodeURIComponent(to)}`;
    } catch {
      unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://pathport.sg"}/unsubscribe?email=${encodeURIComponent(to)}`;
    }
    const { data: sendData, error: sendError } = await resend.emails.send({
      from:    FROM_ADDRESS,
      to,
      subject: rendered.subject,
      html:    rendered.html,
      headers: {
        "List-Unsubscribe":      `<mailto:unsubscribe@pathport.sg?subject=unsubscribe>, <${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    console.log("[Email] resend response:", {
      id:    sendData?.id ?? null,
      error: sendError ? { name: sendError.name, statusCode: sendError.statusCode, message: sendError.message } : null,
    });

    if (sendError) {
      const message = `${sendError.name ?? "resend_error"} (${sendError.statusCode ?? "?"}): ${sendError.message}`;
      if (logId) {
        await supabase
          .from("email_log")
          .update({ status: "failed", error_message: message })
          .eq("id", logId);
      }
      console.error("[Email] resend rejected:", message);
      return { success: false, logId, error: message };
    }

    if (logId) {
      await supabase
        .from("email_log")
        .update({
          status:   "sent",
          sent_at:  new Date().toISOString(),
          metadata: { ...(metadata ?? {}), resend_id: sendData?.id ?? null },
        })
        .eq("id", logId);
    }
    return { success: true, logId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (logId) {
      await supabase
        .from("email_log")
        .update({ status: "failed", error_message: message })
        .eq("id", logId);
    }
    console.error("[Email] send error:", message);
    return { success: false, logId, error: message };
  }
}

// ─── Legacy helpers (kept for backward compat with /api/applications/[id]/stage) ──

export async function sendApplicationUpdate(opts: {
  to:             string;
  name:           string;
  courseName:     string;
  stageLabel:     string;
  message?:       string | null;
  applicationId?: string;
  userId?:        string;
}): Promise<SendResult> {
  return sendTemplatedEmail({
    to:            opts.to,
    template:      stageLabelToTemplate(opts.stageLabel),
    context: {
      name:       opts.name,
      courseName: opts.courseName,
      message:    opts.message,
    },
    applicationId: opts.applicationId ?? null,
    userId:        opts.userId        ?? null,
    metadata:      { stage_label: opts.stageLabel },
  });
}

function stageLabelToTemplate(label: string): EmailTemplate {
  const lower = label.toLowerCase();
  if (lower.includes("submitted"))                        return "application_submitted";
  if (lower.includes("document") && lower.includes("pending")) return "documents_requested";
  if (lower.includes("document") && lower.includes("verified")) return "documents_approved";
  if (lower.includes("offer"))                            return "offer_letter_available";
  if (lower.includes("fee") || lower.includes("payment")) return "fee_payment_reminder";
  if (lower.includes("ipa") && lower.includes("process")) return "ipa_processing";
  if (lower.includes("ipa") || lower.includes("approved")) return "ipa_approved";
  if (lower.includes("arriv"))                            return "arrival_preparation";
  return "application_submitted";
}

export async function sendApplicationReceived(opts: {
  to:             string;
  name:           string;
  courseName:     string;
  collegeName:    string;
  applicationId?: string;
  userId?:        string;
}): Promise<SendResult> {
  return sendTemplatedEmail({
    to:            opts.to,
    template:      "application_submitted",
    context:       { name: opts.name, courseName: opts.courseName, collegeName: opts.collegeName },
    applicationId: opts.applicationId ?? null,
    userId:        opts.userId        ?? null,
  });
}

