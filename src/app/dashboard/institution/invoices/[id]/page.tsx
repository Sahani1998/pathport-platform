import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, Receipt, FileText, Clock,
} from "lucide-react";
import {
  INVOICE_STATUS_META, INVOICE_LINE_TYPE_LABEL, INVOICE_FEE_TYPE_META,
  type StudentInvoice, type InvoiceLineItem, type PaymentAttempt,
  type PaymentProof, type OfficialReceipt, type InvoiceFeeType,
} from "@/types/payment";
import { formatCents } from "@/lib/payments/invoice-helpers";
import VerificationPanel from "@/components/payments/VerificationPanel";

export const dynamic = "force-dynamic";

export default async function InstitutionInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") redirect("/dashboard");

  const { data: invoice } = await supabase
    .from("student_invoices").select("*").eq("id", id).maybeSingle();
  if (!invoice) notFound();

  if (profile.role === "institution" && invoice.college_id !== profile.college_id) {
    redirect("/dashboard/institution/applications");
  }

  const [
    { data: lines },
    { data: attempts },
    { data: studentProfile },
    { data: course },
    { data: app },
  ] = await Promise.all([
    supabase.from("invoice_line_items").select("*").eq("invoice_id", id).order("sort_order"),
    supabase.from("payment_attempts").select("*").eq("invoice_id", id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("public_id, full_name, email").eq("id", invoice.student_id).single(),
    supabase.from("courses").select("title").eq("id", invoice.course_id).single(),
    supabase.from("applications").select("id, public_id").eq("id", invoice.application_id).single(),
  ]);

  const attemptIds = ((attempts ?? []) as PaymentAttempt[]).map(a => a.id);

  const [{ data: proofs }, { data: receipts }] = await Promise.all([
    attemptIds.length
      ? supabase.from("payment_proofs").select("*").in("payment_attempt_id", attemptIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as PaymentProof[] }),
    attemptIds.length
      ? supabase.from("official_receipts").select("*").in("payment_attempt_id", attemptIds)
      : Promise.resolve({ data: [] as OfficialReceipt[] }),
  ]);

  const proofsByAttempt: Record<string, PaymentProof[]> = {};
  for (const p of ((proofs ?? []) as PaymentProof[])) {
    (proofsByAttempt[p.payment_attempt_id] ??= []).push(p);
  }
  const receiptByAttempt: Record<string, OfficialReceipt> = {};
  for (const r of ((receipts ?? []) as OfficialReceipt[])) {
    receiptByAttempt[r.payment_attempt_id] = r;
  }

  const meta    = INVOICE_STATUS_META[invoice.status as keyof typeof INVOICE_STATUS_META];
  const feeMeta = invoice.fee_type ? INVOICE_FEE_TYPE_META[invoice.fee_type as InvoiceFeeType] : null;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href={`/dashboard/institution/applications/${invoice.application_id}/invoices`}
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-xs transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-pathBlue-400 font-body text-[11px] font-semibold uppercase tracking-wider">
            {invoice.public_id ?? "(draft)"}
          </p>
          <h2 className="font-display text-3xl text-white mt-1">{(course as { title: string } | null)?.title ?? "—"}</h2>
          <p className="text-white/50 font-body text-sm mt-1">
            {studentProfile?.full_name} · {studentProfile?.email}
            {studentProfile?.public_id && <span className="font-mono text-white/35"> · {studentProfile.public_id}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {feeMeta && (
            <span className={`px-3 py-1 rounded-full border font-body text-xs font-semibold ${feeMeta.color}`}>{feeMeta.label}</span>
          )}
          <span className={`px-3 py-1 rounded-full border font-body text-xs font-semibold ${meta.color}`}>{meta.label}</span>
          {invoice.status !== "draft" && (
            <a href={`/api/invoices/${id}/download`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
              <Download className="w-3 h-3" /> Download
            </a>
          )}
        </div>
      </div>

      {/* Summary panel */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">Amount</p>
          <p className="font-display text-xl text-gold-400 font-bold">{formatCents(invoice.amount_cents, invoice.currency)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">Source</p>
          <p className="font-body text-sm text-white/85">{invoice.source === "uploaded" ? "Uploaded PDF" : "Generated"}</p>
          {invoice.external_invoice_number && (
            <p className="text-white/35 font-body text-[11px] mt-0.5 font-mono">{invoice.external_invoice_number}</p>
          )}
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">Due</p>
          <p className="font-body text-sm text-white/85">
            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-SG", { dateStyle: "medium" }) : "—"}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">Methods</p>
          <p className="font-body text-sm text-white/85">
            {(invoice.payment_methods_allowed ?? []).map((m: string) => m.replace("_", " ")).join(", ") || "—"}
          </p>
        </div>
      </section>

      {invoice.description && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/65 font-body text-sm">
          {invoice.description}
        </div>
      )}

      {/* Line items */}
      {invoice.source === "generated" && (lines ?? []).length > 0 && (
        <section className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.07] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gold-400" />
            <p className="font-display text-base text-white">Line Items</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["Type", "Description", "Amount"].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-white/30 font-body text-[10px] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {((lines ?? []) as InvoiceLineItem[]).map(li => (
                <tr key={li.id} className="border-b border-white/[0.04]">
                  <td className="px-5 py-3 font-body text-xs text-white/60">{INVOICE_LINE_TYPE_LABEL[li.line_type]}</td>
                  <td className="px-5 py-3 font-body text-xs text-white/80">{li.description}</td>
                  <td className={`px-5 py-3 font-body text-xs text-right font-mono ${li.amount_cents < 0 ? "text-red-400" : "text-white/80"}`}>
                    {formatCents(li.amount_cents, li.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Payment attempts + verification */}
      <section className="space-y-3">
        <p className="font-display text-base text-white">Payment Attempts</p>
        {((attempts ?? []) as PaymentAttempt[]).length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-white/35 font-body text-sm flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> No attempts yet
          </div>
        ) : (
          <div className="space-y-2">
            {((attempts ?? []) as PaymentAttempt[]).map(att => (
              <VerificationPanel
                key={att.id}
                attempt={att}
                proofs={proofsByAttempt[att.id] ?? []}
                receipt={receiptByAttempt[att.id] ?? null}
                invoiceAmountCents={invoice.amount_cents}
                invoiceCurrency={invoice.currency}
              />
            ))}
          </div>
        )}
      </section>

      <p className="text-white/30 font-body text-[11px] text-center font-mono">
        App {(app as { public_id: string | null } | null)?.public_id ?? invoice.application_id.slice(0, 8)}
      </p>
    </div>
  );
}
