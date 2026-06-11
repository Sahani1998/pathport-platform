import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import type { EmailTemplate, TemplateContext } from "@/lib/email/templates";

const SAMPLE_CONTEXTS: Record<EmailTemplate, TemplateContext> = {
  application_submitted:        { name: "Priya Sharma", courseName: "Diploma in Business Management", collegeName: "PSB Academy" },
  documents_requested:          { name: "Priya Sharma", courseName: "Diploma in Business Management", message: "Please upload your academic transcripts, passport copy, and financial statement." },
  documents_approved:           { name: "Priya Sharma", courseName: "Diploma in Business Management" },
  document_verified:            { name: "Priya Sharma", documentType: "Passport", collegeName: "PSB Academy", comment: "Clear photo page — accepted." },
  document_rejected:            { name: "Priya Sharma", documentType: "Financial Proof", comment: "Bank statement is older than 3 months. Please upload a more recent one." },
  document_reupload_requested:  { name: "Priya Sharma", documentType: "Education Certificate", comment: "Please upload the original certificate — photos are blurry." },
  partner_approved:             { name: "ABC Institute", partnerType: "Institution", portalUrl: "https://pathport.sg/login", email: "admin@abcinstitute.sg", temporaryPassword: "Temp@12345" },
  partner_activation:           { name: "ABC Institute", partnerType: "Institution", activationUrl: "https://pathport.sg/activate-account#access_token=example" },
  partner_rejected:             { name: "ABC Institute", reason: "Insufficient accreditation documentation provided." },
  offer_letter_available:       { name: "Priya Sharma", courseName: "Diploma in Business Management", collegeName: "PSB Academy" },
  fee_payment_reminder:         { name: "Priya Sharma", courseName: "Diploma in Business Management", amount: "SGD 2,400", dueDate: "30 July 2025" },
  ipa_processing:               { name: "Priya Sharma", courseName: "Diploma in Business Management" },
  ipa_approved:                 { name: "Priya Sharma", courseName: "Diploma in Business Management" },
  arrival_preparation:          { name: "Priya Sharma", courseName: "Diploma in Business Management" },
  application_withdrawn:        { name: "Priya Sharma", courseName: "Diploma in Business Management", reason: "Accepted at another institution" },
  withdrawal_notice_internal:   { studentName: "Priya Sharma", courseName: "Diploma in Business Management", collegeName: "PSB Academy", reason: "Accepted at another institution", message: "Found a more suitable course locally." },
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`admin-test-email:${ip}`, 10, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const to       = String(body.to       ?? "").trim();
  const template = String(body.template ?? "").trim() as EmailTemplate;

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))
    return NextResponse.json({ error: "A valid recipient email is required" }, { status: 400 });

  const validTemplates = Object.keys(SAMPLE_CONTEXTS) as EmailTemplate[];
  if (!validTemplates.includes(template))
    return NextResponse.json({ error: "Invalid template name" }, { status: 400 });

  const context = SAMPLE_CONTEXTS[template];
  const result = await sendTemplatedEmail({
    to,
    template,
    context,
    userId:   user.id,
    metadata: { test: true, sentBy: user.id },
  });

  return NextResponse.json({
    success:  result.success,
    logId:    result.logId,
    error:    result.error ?? null,
    template,
    to,
  }, { status: result.success ? 200 : 500 });
}
