import { getEmailClient, FROM_ADDRESS } from "./client";
import { renderTemplate, type EmailTemplate, type TemplateContext } from "./templates";
import { createClient } from "@/lib/supabase/server";

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
  const rendered = renderTemplate(template, context);

  const supabase = await createClient();

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
    await resend.emails.send({
      from:    FROM_ADDRESS,
      to,
      subject: rendered.subject,
      html:    rendered.html,
    });
    if (logId) {
      await supabase
        .from("email_log")
        .update({ status: "sent", sent_at: new Date().toISOString() })
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

// Backward-compat welcome — older code may import it
export async function sendWelcomeEmail(to: string, name: string): Promise<SendResult> {
  return sendTemplatedEmail({
    to,
    template: "application_submitted",
    context:  { name, courseName: "PathPort" },
  });
}
