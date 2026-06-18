import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, MessageCircle, Mail, Phone, Receipt,
} from "lucide-react";
import StudentPaymentFlow from "@/components/payments/StudentPaymentFlow";
import PaymentSummaryCard from "@/components/payments/PaymentSummaryCard";
import {
  INVOICE_STATUS_META, INVOICE_LINE_TYPE_LABEL, INVOICE_FEE_TYPE_META,
  type StudentInvoice, type InvoiceLineItem, type PaymentAttempt, type PaymentProof,
  type OfficialReceipt, type CollegePaymentSettings, type InvoiceFeeType, type InvoiceStatus,
} from "@/types/payment";
import { formatCents } from "@/lib/payments/invoice-helpers";

export const dynamic = "force-dynamic";

export default async function StudentInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: invoice } = await supabase
    .from("student_invoices").select("*").eq("id", id).maybeSingle();
  if (!invoice) notFound();
  if (invoice.student_id !== user.id) {
    // Don't 404 — bounce to student apps list.
    redirect("/dashboard/student/applications");
  }
  // Drafts are not visible to students; voided invoices are not payable.
  if (invoice.status === "draft" || invoice.status === "void") {
    redirect("/dashboard/student/applications");
  }

  const [
    { data: lines },
    { data: attempts },
    { data: course },
    { data: college },
    { data: app },
  ] = await Promise.all([
    supabase.from("invoice_line_items").select("*").eq("invoice_id", id).order("sort_order"),
    supabase.from("payment_attempts").select("*").eq("invoice_id", id).order("created_at", { ascending: false }),
    supabase.from("courses").select("title").eq("id", invoice.course_id).single(),
    supabase.from("colleges").select("name").eq("id", invoice.college_id).single(),
    supabase.from("applications").select("public_id").eq("id", invoice.application_id).single(),
  ]);

  // Payment instructions — sensitive bank/Wise details. Students aren't allowed
  // to SELECT from college_payment_settings directly (RLS), so we use the admin
  // client and project ONLY the fields needed to render the pay page.
  // We've already confirmed `invoice.student_id === user.id` above.
  const adminDb = createAdminClient();
  const { data: settings } = await adminDb
    .from("college_payment_settings")
    .select(`
      bank_transfer_enabled, bank_name, bank_account_name, bank_account_number,
      bank_swift_code, bank_branch_code, bank_country, bank_currency, bank_payment_instructions,
      wise_enabled, wise_recipient_name, wise_recipient_email, wise_currency, wise_instructions,
      finance_contact_name, finance_email, finance_phone, finance_whatsapp
    `)
    .eq("college_id", invoice.college_id)
    .maybeSingle();

  // Proofs and official receipts scoped to this student's attempts
  const attemptIds = ((attempts ?? []) as PaymentAttempt[]).map(a => a.id);
  const [{ data: proofs }, { data: receipts }] = await Promise.all([
    attemptIds.length
      ? supabase.from("payment_proofs").select("*").in("payment_attempt_id", attemptIds)
      : Promise.resolve({ data: [] as PaymentProof[] }),
    attemptIds.length
      ? supabase.from("official_receipts").select("*").in("payment_attempt_id", attemptIds)
      : Promise.resolve({ data: [] as OfficialReceipt[] }),
  ]);

  const proofsByAttempt: Record<string, PaymentProof[]> = {};
  for (const p of ((proofs ?? []) as PaymentProof[])) {
    (proofsByAttempt[p.payment_attempt_id] ??= []).push(p);
  }

  const receiptList = (receipts ?? []) as OfficialReceipt[];

  const amountReceivedCents = ((attempts ?? []) as PaymentAttempt[])
    .filter(a => a.status === "verified")
    .reduce((sum, a) => sum + ((a as PaymentAttempt & { paid_amount_cents: number | null }).paid_amount_cents ?? 0), 0);

  const meta    = INVOICE_STATUS_META[invoice.status as keyof typeof INVOICE_STATUS_META];
  const feeMeta = invoice.fee_type ? INVOICE_FEE_TYPE_META[invoice.fee_type as InvoiceFeeType] : null;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/student/applications"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-xs transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Applications
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-pathBlue-400 font-body text-[11px] font-semibold uppercase tracking-wider">{college?.name ?? ""}</p>
          <h2 className="font-display text-3xl text-white mt-1">{course?.title ?? "Invoice"}</h2>
          <p className="font-mono text-white/45 font-body text-sm mt-1">{invoice.public_id ?? ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {feeMeta && (
            <span className={`px-3 py-1 rounded-full border font-body text-xs font-semibold ${feeMeta.color}`}>{feeMeta.label}</span>
          )}
          <span className={`px-3 py-1 rounded-full border font-body text-xs font-semibold ${meta.color}`}>{meta.label}</span>
          <a href={`/api/invoices/${id}/download`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
            <Download className="w-3 h-3" /> Download
          </a>
        </div>
      </div>

      {/* Amount panel */}
      <section className="p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/25">
        <p className="text-white/45 font-body text-[10px] uppercase tracking-widest mb-1">Amount Due</p>
        <p className="font-display text-4xl font-bold text-gold-400">{formatCents(invoice.amount_cents, invoice.currency)}</p>
        {invoice.due_date && (
          <p className="text-white/50 font-body text-sm mt-1">
            Due by {new Date(invoice.due_date).toLocaleDateString("en-SG", { dateStyle: "long" })}
          </p>
        )}
        {invoice.description && (
          <p className="text-white/55 font-body text-sm mt-3 pt-3 border-t border-white/[0.07]">{invoice.description}</p>
        )}
      </section>

      {/* Payment summary (paid / partially paid) */}
      <PaymentSummaryCard
        invoiceAmountCents={invoice.amount_cents}
        invoiceCurrency={invoice.currency}
        amountReceivedCents={amountReceivedCents}
        invoiceStatus={invoice.status as InvoiceStatus}
      />

      {/* Line items (generated only) */}
      {invoice.source === "generated" && (lines ?? []).length > 0 && (
        <section className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.07]">
            <p className="font-display text-base text-white">Charges</p>
          </div>
          <table className="w-full">
            <tbody>
              {((lines ?? []) as InvoiceLineItem[]).map(li => (
                <tr key={li.id} className="border-b border-white/[0.05] last:border-0">
                  <td className="px-5 py-3 font-body text-xs text-white/40">{INVOICE_LINE_TYPE_LABEL[li.line_type]}</td>
                  <td className="px-5 py-3 font-body text-sm text-white/85">{li.description}</td>
                  <td className={`px-5 py-3 font-body text-sm text-right font-mono ${li.amount_cents < 0 ? "text-red-400" : "text-white/85"}`}>
                    {formatCents(li.amount_cents, li.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Payment flow + proof upload */}
      <StudentPaymentFlow
        invoice={invoice as StudentInvoice}
        attempts={(attempts ?? []) as PaymentAttempt[]}
        proofsByAttempt={proofsByAttempt}
        instructions={settings as CollegePaymentSettings | null}
      />

      {/* Official receipts */}
      {receiptList.length > 0 && (
        <section className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-400/20 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <p className="font-display text-base text-emerald-400">Official Receipt{receiptList.length > 1 ? "s" : ""}</p>
          </div>
          {receiptList.map(r => (
            <a key={r.id} href={`/api/official-receipts/${r.id}/download`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-emerald-400/20 hover:border-emerald-400/40 transition-colors group">
              <div>
                <p className="font-mono text-sm text-white/85">{r.public_id}</p>
                <p className="font-body text-[11px] text-white/40 mt-0.5">
                  {formatCents(r.amount_cents, r.currency)} · Issued {new Date(r.issued_at).toLocaleDateString("en-SG", { dateStyle: "medium" })}
                </p>
              </div>
              <Download className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
            </a>
          ))}
        </section>
      )}

      {/* Finance contact */}
      {(settings?.finance_email || settings?.finance_phone || settings?.finance_whatsapp) && (
        <section className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-white/45 font-body text-[11px] uppercase tracking-wider mb-2">Questions? Contact Finance</p>
          <div className="flex flex-wrap gap-3 text-white/65 font-body text-xs">
            {settings.finance_contact_name && <span>{settings.finance_contact_name}</span>}
            {settings.finance_email    && <a href={`mailto:${settings.finance_email}`}    className="flex items-center gap-1.5 hover:text-gold-400"><Mail className="w-3 h-3" />{settings.finance_email}</a>}
            {settings.finance_phone    && <a href={`tel:${settings.finance_phone}`}        className="flex items-center gap-1.5 hover:text-gold-400"><Phone className="w-3 h-3" />{settings.finance_phone}</a>}
            {settings.finance_whatsapp && <a href={`https://wa.me/${settings.finance_whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-gold-400"><MessageCircle className="w-3 h-3" />{settings.finance_whatsapp}</a>}
          </div>
        </section>
      )}

      {app?.public_id && (
        <p className="text-white/30 font-body text-[10px] text-center font-mono">Application {app.public_id}</p>
      )}
    </div>
  );
}
