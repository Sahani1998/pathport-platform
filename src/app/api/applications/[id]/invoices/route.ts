// POST + GET /api/applications/[id]/invoices
//
// POST handles BOTH paths via Content-Type:
//   - JSON body  → generated invoice (line items from caller)
//   - multipart  → uploaded PDF invoice (institution's own PDF)
//
// In both cases the invoice starts as 'draft'. Issuance (status → 'pending',
// assigns public_id, sets issued_at) is a separate POST /issue call so the
// institution can review/edit before sending.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import {
  validateInvoiceLines, validatePaymentMethods, isAllowedCurrency,
} from "@/lib/payments/invoice-helpers";
import type { Currency, InvoiceSource, InvoiceFeeType, StudentInvoice, PaymentMethod } from "@/types/payment";

const ALLOWED_FEE_TYPES = new Set<InvoiceFeeType>(["application_fee", "tuition_fee", "other"]);
function parseFeeType(value: unknown): InvoiceFeeType | null {
  return typeof value === "string" && ALLOWED_FEE_TYPES.has(value as InvoiceFeeType)
    ? (value as InvoiceFeeType)
    : null;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME   = new Set(["application/pdf"]);

async function loadAppContext(supabase: Awaited<ReturnType<typeof createClient>>, applicationId: string) {
  const { data } = await supabase
    .from("applications")
    .select("id, student_id, course_id, courses!inner(college_id)")
    .eq("id", applicationId)
    .single();
  if (!data) return null;
  type Row = { id: string; student_id: string; course_id: string; courses: { college_id: string } | { college_id: string }[] | null };
  const r = data as unknown as Row;
  const course = Array.isArray(r.courses) ? r.courses[0] : r.courses;
  if (!course) return null;
  return { id: r.id, student_id: r.student_id, course_id: r.course_id, college_id: course.college_id };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: applicationId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`invoice-list:${ip}`, LIMITS.invoiceRead.limit, LIMITS.invoiceRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("student_invoices")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: (data ?? []) as StudentInvoice[] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: applicationId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`invoice-create:${ip}`, LIMITS.invoiceWrite.limit, LIMITS.invoiceWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const app = await loadAppContext(supabase, applicationId);
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  if (profile.role === "institution" && profile.college_id !== app.college_id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.toLowerCase().includes("multipart/form-data");

  if (isMultipart) {
    return handleUploaded(request, supabase, user.id, app);
  }
  return handleGenerated(request, supabase, user.id, app);
}

// ─── Generated invoice (JSON body) ───────────────────────────────────────────

async function handleGenerated(
  request: Request,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  app: { id: string; student_id: string; course_id: string; college_id: string },
) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const currency: Currency = isAllowedCurrency(body.currency) ? body.currency : "SGD";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 1000) : null;
  const dueDate     = typeof body.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.due_date) ? body.due_date : null;
  const methods     = validatePaymentMethods(body.payment_methods_allowed) ?? ["bank_transfer", "wise"] as PaymentMethod[];
  if (methods.length === 0) return NextResponse.json({ error: "At least one payment method required" }, { status: 400 });
  const feeType = parseFeeType(body.fee_type);

  const lv = validateInvoiceLines(body.line_items, currency);
  if (!lv.ok) return NextResponse.json({ error: lv.error }, { status: 400 });

  // Insert invoice (status=draft, no public_id, no issued_at).
  const { data: invoice, error: invErr } = await supabase
    .from("student_invoices")
    .insert({
      application_id: app.id,
      student_id:     app.student_id,
      college_id:     app.college_id,
      course_id:      app.course_id,
      source:         "generated" satisfies InvoiceSource,
      fee_type:       feeType,
      status:         "draft",
      currency,
      due_date:       dueDate,
      description,
      payment_methods_allowed: methods,
      created_by:     userId,
    })
    .select()
    .single();
  if (invErr || !invoice) return NextResponse.json({ error: invErr?.message ?? "Insert failed" }, { status: 500 });

  // Insert line items — recompute trigger updates parent amount_cents.
  const rows = lv.lines.map((l, idx) => ({
    invoice_id:   invoice.id as string,
    line_type:    l.line_type,
    description:  l.description,
    amount_cents: l.amount_cents,
    currency:     l.currency,
    sort_order:   idx,
  }));
  const { error: liErr } = await supabase.from("invoice_line_items").insert(rows);
  if (liErr) {
    // Rollback the parent so we don't leave an orphan draft.
    await supabase.from("student_invoices").delete().eq("id", invoice.id);
    return NextResponse.json({ error: liErr.message }, { status: 500 });
  }

  // Re-read to pick up the recomputed amount.
  const { data: fresh } = await supabase
    .from("student_invoices").select("*").eq("id", invoice.id).single();
  return NextResponse.json({ invoice: fresh as StudentInvoice }, { status: 201 });
}

// ─── Uploaded invoice (multipart) ────────────────────────────────────────────

async function handleUploaded(
  request: Request,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  app: { id: string; student_id: string; course_id: string; college_id: string },
) {
  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = form.get("file") as File | null;
  if (!file)                              return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  if (!ALLOWED_MIME.has(file.type))       return NextResponse.json({ error: "Only PDF accepted" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES)         return NextResponse.json({ error: "File exceeds 10 MB" }, { status: 400 });

  const amountRaw   = Number(form.get("amount_cents"));
  if (!Number.isInteger(amountRaw) || amountRaw < 0) {
    return NextResponse.json({ error: "amount_cents must be a non-negative integer" }, { status: 400 });
  }
  const currencyRaw = String(form.get("currency") ?? "SGD");
  if (!isAllowedCurrency(currencyRaw)) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }
  const description = String(form.get("description") ?? "").trim().slice(0, 1000) || null;
  const dueDate     = String(form.get("due_date")    ?? "").trim();
  const dueDateNorm = /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : null;
  const externalRef = String(form.get("external_invoice_number") ?? "").trim().slice(0, 80) || null;

  const methodsRaw = form.getAll("payment_method"); // multiple values allowed
  const methodsList = methodsRaw.length ? methodsRaw.map(String) : ["bank_transfer", "wise"];
  const methods    = validatePaymentMethods(methodsList);
  if (!methods || methods.length === 0) {
    return NextResponse.json({ error: "At least one valid payment method required" }, { status: 400 });
  }
  const feeType = parseFeeType(form.get("fee_type"));

  // Upload to storage first — we hold the path even on DB failure (rolled back below).
  const timestamp   = Date.now();
  const storagePath = `${app.id}/${timestamp}-uploaded.pdf`;
  const buffer      = await file.arrayBuffer();
  const { error: storeErr } = await supabase.storage
    .from("invoices")
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });
  if (storeErr) return NextResponse.json({ error: `Storage upload failed: ${storeErr.message}` }, { status: 500 });

  const { data: invoice, error: invErr } = await supabase
    .from("student_invoices")
    .insert({
      application_id: app.id,
      student_id:     app.student_id,
      college_id:     app.college_id,
      course_id:      app.course_id,
      source:         "uploaded" satisfies InvoiceSource,
      fee_type:       feeType,
      status:         "draft",
      amount_cents:   amountRaw,
      currency:       currencyRaw,
      due_date:       dueDateNorm,
      description,
      file_path:      storagePath,
      external_invoice_number: externalRef,
      payment_methods_allowed: methods,
      created_by:     userId,
    })
    .select()
    .single();

  if (invErr || !invoice) {
    await supabase.storage.from("invoices").remove([storagePath]);
    return NextResponse.json({ error: invErr?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ invoice: invoice as StudentInvoice }, { status: 201 });
}
