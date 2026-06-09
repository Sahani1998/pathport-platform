import { getEmailClient, FROM_ADDRESS, SITE_URL } from "./client";

export interface SendResult {
  success: boolean;
  error?: string;
}

// ─── Shared wrapper ───────────────────────────────────────────────────────────

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const resend = getEmailClient();
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set — email skipped");
    return { success: false, error: "Email service not configured" };
  }
  try {
    await resend.emails.send({ from: FROM_ADDRESS, ...opts });
    return { success: true };
  } catch (err) {
    console.error("[Email] send error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── HTML shell ───────────────────────────────────────────────────────────────

function shell(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060B18;font-family:system-ui,sans-serif">
<div style="max-width:580px;margin:0 auto;padding:32px 16px">
  <div style="text-align:center;margin-bottom:28px">
    <span style="font-size:18px;font-weight:700;color:#C9A84C;letter-spacing:.06em">PathPort</span>
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px">
    ${body}
  </div>
  <p style="text-align:center;color:rgba(255,255,255,.2);font-size:11px;margin-top:20px">
    PathPort — Singapore Diploma Platform
  </p>
</div>
</body></html>`;
}

function cta(href: string, label: string) {
  return `<a href="${href}" style="display:block;text-align:center;background:#C9A84C;color:#060B18;padding:14px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;margin-top:24px">${label}</a>`;
}

function para(text: string) {
  return `<p style="color:rgba(255,255,255,.65);font-size:14px;margin:0 0 16px">${text}</p>`;
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  name: string,
): Promise<SendResult> {
  return sendEmail({
    to,
    subject: "Welcome to PathPort — Your Singapore journey starts here",
    html: shell(`
      <h1 style="color:#fff;font-size:22px;font-weight:600;margin:0 0 20px">Welcome, ${name}!</h1>
      ${para("Your PathPort account is ready. Explore Singapore diploma programmes, apply to top colleges, and track your full journey — from application to arrival.")}
      ${cta(`${SITE_URL}/dashboard`, "Go to My Dashboard →")}
    `),
  });
}

// ─── Application stage update ─────────────────────────────────────────────────

export async function sendApplicationUpdate(opts: {
  to: string;
  name: string;
  courseName: string;
  stageLabel: string;
  message?: string | null;
}): Promise<SendResult> {
  const { to, name, courseName, stageLabel, message } = opts;
  return sendEmail({
    to,
    subject: `Application Update: ${stageLabel} — ${courseName}`,
    html: shell(`
      <h1 style="color:#fff;font-size:22px;font-weight:600;margin:0 0 8px">Application Update</h1>
      ${para(`Hi ${name}, your application for <strong style="color:#fff">${courseName}</strong> has been updated.`)}
      <div style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.25);border-radius:12px;padding:16px;margin:20px 0;text-align:center">
        <p style="color:rgba(255,255,255,.45);font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px">Status</p>
        <p style="color:#C9A84C;font-size:20px;font-weight:700;margin:0">${stageLabel}</p>
      </div>
      ${message ? `<p style="color:rgba(255,255,255,.6);font-size:14px;background:rgba(255,255,255,.03);border-radius:8px;padding:12px;margin:0 0 8px">${message}</p>` : ""}
      ${cta(`${SITE_URL}/dashboard/student/applications`, "View Application →")}
    `),
  });
}

// ─── Application received confirmation ────────────────────────────────────────

export async function sendApplicationReceived(opts: {
  to: string;
  name: string;
  courseName: string;
  collegeName: string;
}): Promise<SendResult> {
  const { to, name, courseName, collegeName } = opts;
  return sendEmail({
    to,
    subject: `Application Received — ${courseName}`,
    html: shell(`
      <h1 style="color:#fff;font-size:22px;font-weight:600;margin:0 0 8px">Application Received!</h1>
      ${para(`Hi ${name}, we've received your application for <strong style="color:#fff">${courseName}</strong> at ${collegeName}.`)}
      ${para("Our team will review your application and get back to you within 24 hours. You'll receive email updates at every stage.")}
      ${cta(`${SITE_URL}/dashboard/student/applications`, "Track My Application →")}
    `),
  });
}
