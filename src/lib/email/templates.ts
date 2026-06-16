import { SITE_URL } from "./client";

// ─── HTML shell ───────────────────────────────────────────────────────────────

function shell(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060B18;font-family:system-ui,-apple-system,sans-serif">
<div style="max-width:580px;margin:0 auto;padding:32px 16px">
  <div style="text-align:center;margin-bottom:28px">
    <span style="font-size:18px;font-weight:700;color:#C9A84C;letter-spacing:.06em">PathPort</span>
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px">
    ${body}
  </div>
  <p style="text-align:center;color:rgba(255,255,255,.2);font-size:11px;margin-top:20px">
    PathPort — Singapore Diploma Platform<br>
    <a href="${SITE_URL}" style="color:rgba(201,168,76,.6);text-decoration:none">pathport.sg</a>
  </p>
</div>
</body></html>`;
}

function cta(href: string, label: string) {
  return `<a href="${href}" style="display:block;text-align:center;background:#C9A84C;color:#060B18;padding:14px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;margin-top:24px">${label}</a>`;
}

function h1(text: string) {
  return `<h1 style="color:#fff;font-size:22px;font-weight:600;margin:0 0 12px">${text}</h1>`;
}

function p(text: string) {
  return `<p style="color:rgba(255,255,255,.65);font-size:14px;margin:0 0 16px;line-height:1.6">${text}</p>`;
}

function highlight(label: string, value: string) {
  return `<div style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.25);border-radius:12px;padding:16px;margin:20px 0;text-align:center">
    <p style="color:rgba(255,255,255,.45);font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px">${label}</p>
    <p style="color:#C9A84C;font-size:18px;font-weight:700;margin:0">${value}</p>
  </div>`;
}

function quote(text: string) {
  return `<p style="color:rgba(255,255,255,.6);font-size:14px;background:rgba(255,255,255,.03);border-left:2px solid rgba(201,168,76,.4);border-radius:4px;padding:12px 16px;margin:16px 0;line-height:1.5">${text}</p>`;
}

// ─── Template registry ────────────────────────────────────────────────────────

export type EmailTemplate =
  | "application_submitted"
  | "documents_requested"
  | "document_request"
  | "documents_approved"
  | "document_verified"
  | "document_rejected"
  | "document_reupload_requested"
  | "offer_letter_available"
  | "offer_letter_accepted"
  | "offer_letter_decision_internal"
  | "fee_payment_reminder"
  | "invoice_issued"
  | "payment_verified"
  | "payment_rejected"
  | "payment_info_requested"
  | "official_receipt_issued"
  | "ipa_processing"
  | "ipa_approved"
  | "arrival_preparation"
  | "enrollment_completed"
  | "application_withdrawn"
  | "withdrawal_notice_internal"
  | "partner_approved"
  | "partner_activation"
  | "partner_rejected";

export interface TemplateContext {
  name?: string;
  courseName?: string;
  collegeName?: string;
  message?: string | null;
  reason?: string;
  applicationId?: string;
  amount?: string;
  dueDate?: string;
  invoiceNumber?: string;
  receiptNumber?: string;
  studentName?: string;
  documentType?: string;
  comment?: string | null;
  // Partner approval
  partnerType?: string;
  portalUrl?: string;
  email?: string;
  temporaryPassword?: string;
  // Account activation
  activationUrl?: string;
  // Document requests
  requestTitle?: string;
  deadline?: string;
  priority?: string;
  // Offer letter decisions
  decision?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

const dashboardUrl   = `${SITE_URL}/dashboard/student/applications`;
const documentsUrl   = `${SITE_URL}/dashboard/student/documents`;
const arrivalUrl     = `${SITE_URL}/dashboard/student/arrival`;
const adminAppsUrl   = `${SITE_URL}/dashboard/admin/applications`;
const instAppsUrl    = `${SITE_URL}/dashboard/institution/applications`;

export const TEMPLATES: Record<EmailTemplate, (ctx: TemplateContext) => RenderedEmail> = {

  application_submitted: ctx => ({
    subject: `Application Received — ${ctx.courseName ?? "your course"}`,
    html: shell(
      h1("Application received!") +
      p(`Hi ${ctx.name ?? "there"}, we've received your application for <strong style="color:#fff">${ctx.courseName ?? "your course"}</strong>${ctx.collegeName ? ` at ${ctx.collegeName}` : ""}.`) +
      p("Our team reviews every application within 24 hours. You'll get email updates at every stage of your journey — from offer letter to arrival in Singapore.") +
      cta(dashboardUrl, "Track My Application →")
    ),
  }),

  documents_requested: ctx => ({
    subject: "Documents required to proceed with your application",
    html: shell(
      h1("We need a few documents") +
      p(`Hi ${ctx.name ?? "there"}, to move your application forward we need some documents from you.`) +
      (ctx.message ? quote(ctx.message) : "") +
      p("Upload them through your dashboard — we'll review within 24 hours of receiving them.") +
      cta(documentsUrl, "Upload Documents →")
    ),
  }),

  document_request: ctx => ({
    subject: `Document requested — ${ctx.documentType ?? "additional document"}`,
    html: shell(
      h1("A document has been requested") +
      p(`Hi ${ctx.name ?? "there"}, ${ctx.collegeName ?? "the institution"} has requested a document for your application${ctx.courseName ? ` to <strong style="color:#fff">${ctx.courseName}</strong>` : ""}.`) +
      highlight("Requested Document", ctx.requestTitle ?? ctx.documentType ?? "Document") +
      (ctx.message ? quote(ctx.message) : "") +
      (ctx.deadline ? p(`<strong style="color:rgba(255,255,255,.85)">Deadline:</strong> ${ctx.deadline}`) : "") +
      p("Upload it through your documents page — we'll review it within 24 hours of receiving it.") +
      cta(documentsUrl, "Upload Document →")
    ),
  }),

  documents_approved: ctx => ({
    subject: "Documents approved — preparing your offer letter",
    html: shell(
      h1("Your documents are approved") +
      p(`Hi ${ctx.name ?? "there"}, all your submitted documents have been verified.`) +
      highlight("Next Step", "Offer letter is being prepared") +
      p("We'll notify you the moment your offer letter is ready to download.") +
      cta(dashboardUrl, "View Application →")
    ),
  }),

  document_verified: ctx => ({
    subject: `Document verified — ${ctx.documentType ?? "your document"}`,
    html: shell(
      h1("Document verified ✅") +
      p(`Hi ${ctx.name ?? "there"}, your <strong style="color:#fff">${ctx.documentType ?? "document"}</strong> has been reviewed and verified by ${ctx.collegeName ?? "the institution"}.`) +
      (ctx.comment ? quote(ctx.comment) : "") +
      p("Keep uploading any remaining documents to keep your application moving forward.") +
      cta(documentsUrl, "View My Documents →")
    ),
  }),

  document_rejected: ctx => ({
    subject: `Action required — document not accepted`,
    html: shell(
      h1("Document not accepted") +
      p(`Hi ${ctx.name ?? "there"}, your <strong style="color:#fff">${ctx.documentType ?? "document"}</strong> could not be accepted.`) +
      (ctx.comment ? highlight("Reviewer Comment", ctx.comment) : "") +
      p("Please review the feedback above and upload a corrected version through your dashboard.") +
      cta(documentsUrl, "Upload Corrected Document →")
    ),
  }),

  document_reupload_requested: ctx => ({
    subject: `Please re-upload — ${ctx.documentType ?? "document"}`,
    html: shell(
      h1("Re-upload requested") +
      p(`Hi ${ctx.name ?? "there"}, the institution has requested a new version of your <strong style="color:#fff">${ctx.documentType ?? "document"}</strong>.`) +
      (ctx.comment ? quote(ctx.comment) : "") +
      p("Your original file has been archived. Please upload a fresh copy through your documents page.") +
      cta(documentsUrl, "Upload Document →")
    ),
  }),

  offer_letter_available: ctx => ({
    subject: `Your offer letter is ready! — ${ctx.courseName ?? "your course"}`,
    html: shell(
      h1("Your offer letter is ready") +
      p(`Congratulations ${ctx.name ?? "there"}! Your offer letter for <strong style="color:#fff">${ctx.courseName ?? "your course"}</strong>${ctx.collegeName ? ` at ${ctx.collegeName}` : ""} is now available.`) +
      highlight("Action Required", "Review offer and pay fee to confirm") +
      p("Download your offer letter from your dashboard and proceed with fee payment to secure your seat.") +
      cta(dashboardUrl, "View Offer Letter →")
    ),
  }),

  offer_letter_accepted: ctx => ({
    subject: `Offer accepted — ${ctx.courseName ?? "your course"}`,
    html: shell(
      h1("You've accepted your offer! 🎊") +
      p(`Hi ${ctx.name ?? "there"}, this confirms you have accepted your offer for <strong style="color:#fff">${ctx.courseName ?? "your course"}</strong>${ctx.collegeName ? ` at ${ctx.collegeName}` : ""}.`) +
      highlight("Next Step", "Complete your fee payment") +
      p("Once your fee payment is confirmed, your IPA (In-Principle Approval) application will be submitted to Singapore's ICA.") +
      cta(dashboardUrl, "View My Application →")
    ),
  }),

  offer_letter_decision_internal: ctx => ({
    subject: `[Internal] Offer ${ctx.decision ?? "decision"} — ${ctx.courseName ?? "course"}`,
    html: shell(
      h1(`Student ${ctx.decision ?? "responded to"} the offer`) +
      p(`<strong style="color:#fff">${ctx.studentName ?? "A student"}</strong> has <strong style="color:#fff">${ctx.decision ?? "responded to"}</strong> the offer letter for <strong style="color:#fff">${ctx.courseName ?? "a course"}</strong>${ctx.collegeName ? ` at ${ctx.collegeName}` : ""}.`) +
      (ctx.comment ? quote(ctx.comment) : "") +
      cta(instAppsUrl, "View Application →")
    ),
  }),

  fee_payment_reminder: ctx => ({
    subject: "Reminder — fee payment pending",
    html: shell(
      h1("Quick reminder about your fee payment") +
      p(`Hi ${ctx.name ?? "there"}, this is a friendly reminder that your fee payment is still pending.`) +
      (ctx.amount ? highlight("Amount Due", ctx.amount) : "") +
      (ctx.dueDate ? p(`<strong style="color:rgba(255,255,255,.85)">Due by:</strong> ${ctx.dueDate}`) : "") +
      p("Complete payment to confirm your seat and move to the IPA (In-Principle Approval) stage of your Singapore student pass.") +
      cta(dashboardUrl, "Pay Now →")
    ),
  }),

  invoice_issued: ctx => ({
    subject: `Invoice ${ctx.invoiceNumber ?? "issued"} — ${ctx.courseName ?? "your course"}`,
    html: shell(
      h1("Your invoice is ready") +
      p(`Hi ${ctx.name ?? "there"}, ${ctx.collegeName ?? "your college"} has issued an invoice for <strong style="color:#fff">${ctx.courseName ?? "your course"}</strong>.`) +
      (ctx.invoiceNumber ? highlight("Invoice Number", ctx.invoiceNumber) : "") +
      (ctx.amount       ? highlight("Amount Due",     ctx.amount)        : "") +
      (ctx.dueDate      ? p(`<strong style="color:rgba(255,255,255,.85)">Due by:</strong> ${ctx.dueDate}`) : "") +
      p("Sign in to view the invoice, choose a payment method (Bank Transfer or Wise) and upload your transfer proof when ready.") +
      cta(dashboardUrl, "View Invoice →")
    ),
  }),

  ipa_processing: ctx => ({
    subject: "Your IPA application is being processed",
    html: shell(
      h1("IPA submission in progress") +
      p(`Hi ${ctx.name ?? "there"}, your In-Principle Approval (IPA) application has been submitted to Singapore's ICA.`) +
      highlight("Typical Timeline", "2 – 4 weeks") +
      p("We'll let you know as soon as we hear back. This is the final step before you can start preparing to travel.") +
      cta(dashboardUrl, "Track Status →")
    ),
  }),

  ipa_approved: ctx => ({
    subject: "🎉 IPA Approved — start planning your arrival!",
    html: shell(
      h1("Your IPA has been approved!") +
      p(`Huge congratulations ${ctx.name ?? "there"}! Your In-Principle Approval letter has been issued — you're cleared to travel to Singapore.`) +
      highlight("Next Steps", "Arrival preparation begins now") +
      p("We've prepared a complete arrival checklist for you: flight booking, accommodation, airport pickup, student pass collection, and your first week in Singapore.") +
      cta(arrivalUrl, "View Arrival Checklist →")
    ),
  }),

  arrival_preparation: ctx => ({
    subject: "Arrival preparation — your Singapore journey starts soon",
    html: shell(
      h1("Let's prepare for Singapore") +
      p(`Hi ${ctx.name ?? "there"}, your Singapore journey is just around the corner. Here's a quick checklist to make sure you're fully prepared.`) +
      `<ul style="color:rgba(255,255,255,.65);font-size:14px;line-height:1.8;margin:16px 0;padding-left:20px">
        <li>Confirm your flight booking</li>
        <li>Arrange accommodation (hostel / homestay)</li>
        <li>Book airport pickup</li>
        <li>Bring all required documents (passport, IPA letter, financial proof)</li>
        <li>Collect Singapore student pass within 14 days of arrival</li>
      </ul>` +
      cta(arrivalUrl, "View Full Checklist →")
    ),
  }),

  enrollment_completed: ctx => ({
    subject: `🎓 Enrollment completed — ${ctx.courseName ?? "your programme"}`,
    html: shell(
      h1("You're officially enrolled!") +
      p(`Congratulations ${ctx.name ?? "there"}! Your enrollment in <strong style="color:#fff">${ctx.courseName ?? "your programme"}</strong>${ctx.collegeName ? ` at ${ctx.collegeName}` : ""} is complete.`) +
      highlight("Status", "Enrolled — your student journey begins") +
      p("Keep an eye on your dashboard for orientation details, class schedules, and internship eligibility updates.") +
      cta(dashboardUrl, "Open My Dashboard →")
    ),
  }),

  application_withdrawn: ctx => ({
    subject: `Application withdrawn — ${ctx.courseName ?? "your course"}`,
    html: shell(
      h1("Application withdrawn") +
      p(`Hi ${ctx.name ?? "there"}, your application for <strong style="color:#fff">${ctx.courseName ?? "your course"}</strong> has been withdrawn as requested.`) +
      (ctx.reason ? highlight("Reason", ctx.reason) : "") +
      p("We're sorry to see you go. If you change your mind or want to explore other Singapore college options, you can browse and apply to new courses anytime.") +
      cta(`${SITE_URL}/dashboard/student/courses`, "Browse Courses →")
    ),
  }),

  withdrawal_notice_internal: ctx => ({
    subject: `[Internal] Application withdrawn — ${ctx.courseName ?? "course"}`,
    html: shell(
      h1("Student withdrew their application") +
      p(`<strong style="color:#fff">${ctx.studentName ?? "A student"}</strong> has withdrawn their application for <strong style="color:#fff">${ctx.courseName ?? "a course"}</strong>${ctx.collegeName ? ` at ${ctx.collegeName}` : ""}.`) +
      (ctx.reason ? highlight("Stated Reason", ctx.reason) : "") +
      (ctx.message ? quote(ctx.message) : "") +
      cta(adminAppsUrl, "View Application →") +
      `<p style="color:rgba(255,255,255,.25);font-size:11px;margin-top:16px;text-align:center">Institution view: <a href="${instAppsUrl}" style="color:rgba(201,168,76,.6)">${instAppsUrl}</a></p>`
    ),
  }),

  partner_activation: ctx => ({
    subject: "Your PathPort Account Has Been Approved — Activate Now",
    html: shell(
      h1("Your application has been approved! 🎉") +
      p(`Hi ${ctx.name ?? "there"}, congratulations! Your application to join PathPort as a <strong style="color:#fff">${ctx.partnerType ?? "partner"}</strong> has been approved.`) +
      p("Click the button below to set your password and activate your account. This link is valid for 24 hours.") +
      cta(ctx.activationUrl ?? SITE_URL + "/login", "Activate Account →") +
      p('<span style="color:rgba(255,255,255,.35);font-size:12px">If you did not apply to PathPort, you can safely ignore this email.</span>')
    ),
  }),

  partner_approved: ctx => ({
    subject: "Welcome to PathPort — Your Account is Ready",
    html: shell(
      h1("Your application has been approved! 🎉") +
      p(`Hi ${ctx.name ?? "there"}, congratulations! Your application to join PathPort as a <strong style="color:#fff">${ctx.partnerType ?? "partner"}</strong> has been approved.`) +
      `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:20px;margin:20px 0">
        <p style="color:rgba(255,255,255,.45);font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px">Your Login Credentials</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:rgba(255,255,255,.45);font-size:13px;padding:6px 0;width:40%">Portal</td><td style="color:#fff;font-size:13px;font-weight:600;padding:6px 0"><a href="${ctx.portalUrl ?? SITE_URL + "/login"}" style="color:#C9A84C;text-decoration:none">${ctx.portalUrl ?? SITE_URL + "/login"}</a></td></tr>
          <tr><td style="color:rgba(255,255,255,.45);font-size:13px;padding:6px 0">Email</td><td style="color:#fff;font-size:13px;font-weight:600;padding:6px 0">${ctx.email ?? "—"}</td></tr>
          <tr><td style="color:rgba(255,255,255,.45);font-size:13px;padding:6px 0">Temp Password</td><td style="color:#C9A84C;font-size:13px;font-weight:700;padding:6px 0;font-family:monospace">${ctx.temporaryPassword ?? "—"}</td></tr>
        </table>
      </div>` +
      p('<strong style="color:rgba(255,200,80,.9)">⚠️ Please change your password immediately after your first login.</strong>') +
      p("If you have any questions, reply to this email or contact your PathPort account manager.") +
      cta(ctx.portalUrl ?? SITE_URL + "/login", "Login to PathPort →")
    ),
  }),

  partner_rejected: ctx => ({
    subject: "PathPort Partner Application Update",
    html: shell(
      h1("Application update") +
      p(`Hi ${ctx.name ?? "there"}, thank you for applying to join PathPort as a partner.`) +
      p("After careful review, we are unable to approve your application at this time.") +
      (ctx.reason ? highlight("Reason", ctx.reason) : "") +
      p("If you believe this is an error or would like to discuss further, please reply to this email. You are welcome to reapply in the future.") +
      cta(`${SITE_URL}/partner-with-us`, "Apply Again →")
    ),
  }),

  payment_verified: ctx => ({
    subject: `Payment confirmed — ${ctx.invoiceNumber ?? "your invoice"}`,
    html: shell(
      h1("Your payment has been verified") +
      p(`Hi ${ctx.name ?? "there"}, great news! Your payment for <strong style="color:#fff">${ctx.courseName ?? "your course"}</strong> has been verified by ${ctx.collegeName ?? "the institution"}.`) +
      (ctx.invoiceNumber ? highlight("Invoice", ctx.invoiceNumber) : "") +
      (ctx.amount ? highlight("Amount Confirmed", ctx.amount) : "") +
      p("Your application will now advance to the IPA processing stage. We'll notify you as soon as your In-Principle Approval is submitted to ICA.") +
      cta(dashboardUrl, "Track My Application →")
    ),
  }),

  payment_rejected: ctx => ({
    subject: `Payment not accepted — action required`,
    html: shell(
      h1("Payment could not be verified") +
      p(`Hi ${ctx.name ?? "there"}, unfortunately the payment proof you submitted for <strong style="color:#fff">${ctx.courseName ?? "your course"}</strong> could not be verified.`) +
      (ctx.reason ? highlight("Reason", ctx.reason) : "") +
      p("Please review the feedback above and either upload a new proof or contact the college finance team if you believe this is an error.") +
      cta(dashboardUrl, "View Invoice →")
    ),
  }),

  payment_info_requested: ctx => ({
    subject: `Additional information needed — payment verification`,
    html: shell(
      h1("Additional information requested") +
      p(`Hi ${ctx.name ?? "there"}, the finance team at ${ctx.collegeName ?? "the institution"} has reviewed your payment proof for <strong style="color:#fff">${ctx.courseName ?? "your course"}</strong> and requires some additional information.`) +
      (ctx.message ? quote(ctx.message) : "") +
      p("Please upload updated proof or a revised document via your invoice page.") +
      cta(dashboardUrl, "View Invoice →")
    ),
  }),

  official_receipt_issued: ctx => ({
    subject: `Official receipt issued — ${ctx.receiptNumber ?? "your payment"}`,
    html: shell(
      h1("Your official receipt is ready") +
      p(`Hi ${ctx.name ?? "there"}, an official receipt has been issued for your payment towards <strong style="color:#fff">${ctx.courseName ?? "your course"}</strong> at ${ctx.collegeName ?? "the institution"}.`) +
      (ctx.receiptNumber ? highlight("Receipt Number", ctx.receiptNumber) : "") +
      (ctx.amount ? highlight("Amount Receipted", ctx.amount) : "") +
      p("You can download your official receipt from your invoice page. Keep it for your records.") +
      cta(dashboardUrl, "Download Receipt →")
    ),
  }),
};

export function renderTemplate(template: EmailTemplate, ctx: TemplateContext): RenderedEmail {
  return TEMPLATES[template](ctx);
}
