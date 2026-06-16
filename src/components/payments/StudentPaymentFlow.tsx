"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Landmark, Globe2, Upload, Loader2, AlertCircle, Copy, CheckCircle2,
  FileText, Download, XCircle, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PAYMENT_ATTEMPT_STATUS_META, ALLOWED_PROOF_MIME, MAX_FILE_BYTES,
  type StudentInvoice, type PaymentAttempt, type PaymentProof, type PaymentMethod,
  type CollegePaymentSettings,
} from "@/types/payment";
import { formatCents } from "@/lib/payments/invoice-helpers";

type PaymentInstructions = Pick<
  CollegePaymentSettings,
  | "bank_transfer_enabled" | "bank_name" | "bank_account_name" | "bank_account_number"
  | "bank_swift_code" | "bank_branch_code" | "bank_country" | "bank_currency" | "bank_payment_instructions"
  | "wise_enabled" | "wise_recipient_name" | "wise_recipient_email" | "wise_currency" | "wise_instructions"
  | "finance_contact_name" | "finance_email" | "finance_phone" | "finance_whatsapp"
>;

interface Props {
  invoice:        StudentInvoice;
  attempts:       PaymentAttempt[];
  proofsByAttempt: Record<string, PaymentProof[]>;
  instructions:   PaymentInstructions | null;
}

function CopyableRow({ label, value }: { label: string; value: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <p className="text-white/40 font-body text-[11px] uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 min-w-0">
        <p className="font-mono text-sm text-white/80 truncate">{value}</p>
        <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-white/30 hover:text-gold-400 transition-colors flex-shrink-0">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function StudentPaymentFlow({ invoice, attempts: initialAttempts, proofsByAttempt: initialProofs, instructions }: Props) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(initialAttempts);
  const [proofs, setProofs] = useState(initialProofs);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Most recent active attempt the student can act on.
  // info_requested and rejected allow re-upload; initiated awaits proof upload.
  const activeAttempt = attempts.find(a =>
    ["initiated", "info_requested", "rejected"].includes(a.status),
  ) ?? null;

  // The most recent verified attempt, if any.
  const verifiedAttempt = attempts.find(a => a.status === "verified") ?? null;

  const allowed = invoice.payment_methods_allowed ?? [];
  const bankAvailable = allowed.includes("bank_transfer") && (instructions?.bank_transfer_enabled ?? false);
  const wiseAvailable = allowed.includes("wise") && (instructions?.wise_enabled ?? false);

  const startAttempt = async (m: PaymentMethod) => {
    setMethod(m);
    setError(null);
    setCreating(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/payment-attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ payment_method: m }),
      });
      const data = await res.json() as { attempt?: PaymentAttempt; error?: string };
      if (!res.ok || !data.attempt) throw new Error(data.error ?? "Failed to start payment");
      setAttempts(prev => [data.attempt!, ...prev]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start payment");
      setMethod(null);
    } finally {
      setCreating(false);
    }
  };

  const handleProofUpload = async (attemptId: string, e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formEl = e.currentTarget;
    const fileInput  = formEl.elements.namedItem("file") as HTMLInputElement;
    const refInput   = formEl.elements.namedItem("receipt_reference") as HTMLInputElement;
    const dateInput  = formEl.elements.namedItem("payment_date") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) { setError("Choose a file first"); return; }

    const fd = new FormData();
    fd.append("file", file);
    if (refInput?.value)  fd.append("receipt_reference", refInput.value);
    if (dateInput?.value) fd.append("payment_date", dateInput.value);

    setUploadingId(attemptId);
    try {
      const res = await fetch(`/api/payment-attempts/${attemptId}/proofs`, { method: "POST", body: fd });
      const data = await res.json() as { proof?: PaymentProof; error?: string };
      if (!res.ok || !data.proof) throw new Error(data.error ?? "Upload failed");
      setProofs(p => ({ ...p, [attemptId]: [data.proof!, ...(p[attemptId] ?? [])] }));
      // Refresh attempt status from server
      const r = await fetch(`/api/invoices/${invoice.id}`);
      const j = await r.json() as { attempts?: PaymentAttempt[] };
      if (j.attempts) setAttempts(j.attempts);
      formEl.reset();
      const fileLabel = document.getElementById(`fl-${attemptId}`);
      if (fileLabel) fileLabel.textContent = "Click to select a file";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const total = formatCents(invoice.amount_cents, invoice.currency);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Paid / verified success banner */}
      {(invoice.status === "paid" || verifiedAttempt) && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/25">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-base text-emerald-400">Payment confirmed</p>
            <p className="font-body text-sm text-emerald-300/70 mt-1">
              Your payment has been verified by the college finance team. Your IPA application is now being processed.
            </p>
            {verifiedAttempt && (
              <p className="font-mono text-[11px] text-emerald-300/50 mt-1">{verifiedAttempt.payment_reference}</p>
            )}
          </div>
        </div>
      )}

      {/* Info requested banner (actionable — student must re-upload) */}
      {activeAttempt?.status === "info_requested" && activeAttempt.info_request_message && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/25">
          <HelpCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-base text-amber-400">Additional information requested</p>
            <p className="font-body text-sm text-amber-300/70 mt-1">{activeAttempt.info_request_message}</p>
            <p className="font-body text-xs text-amber-300/50 mt-1">Please upload an updated proof below.</p>
          </div>
        </div>
      )}

      {/* Rejected banner (actionable — student must re-upload) */}
      {activeAttempt?.status === "rejected" && activeAttempt.rejection_reason && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-400/25">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-base text-red-400">Payment not accepted</p>
            <p className="font-body text-sm text-red-300/70 mt-1">{activeAttempt.rejection_reason}</p>
            <p className="font-body text-xs text-red-300/50 mt-1">Please upload a new proof below.</p>
          </div>
        </div>
      )}

      {!activeAttempt && invoice.status !== "paid" && !verifiedAttempt && (
        <section className="space-y-3">
          <p className="font-display text-lg text-white">Choose a Payment Method</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => bankAvailable && startAttempt("bank_transfer")}
              disabled={!bankAvailable || creating}
              className={cn(
                "p-5 rounded-2xl border text-left transition-all",
                bankAvailable
                  ? "bg-gold-400/[0.06] border-gold-400/25 hover:bg-gold-400/[0.12] hover:border-gold-400/45"
                  : "bg-white/[0.02] border-white/[0.06] opacity-50 cursor-not-allowed",
              )}
            >
              <Landmark className="w-5 h-5 text-gold-400 mb-2" />
              <p className="font-display text-base text-white">Bank Transfer</p>
              <p className="font-body text-xs text-white/45 mt-1">
                {bankAvailable ? "Local or international wire to the college's bank account" : "Not available"}
              </p>
            </button>
            <button
              onClick={() => wiseAvailable && startAttempt("wise")}
              disabled={!wiseAvailable || creating}
              className={cn(
                "p-5 rounded-2xl border text-left transition-all",
                wiseAvailable
                  ? "bg-gold-400/[0.06] border-gold-400/25 hover:bg-gold-400/[0.12] hover:border-gold-400/45"
                  : "bg-white/[0.02] border-white/[0.06] opacity-50 cursor-not-allowed",
              )}
            >
              <Globe2 className="w-5 h-5 text-gold-400 mb-2" />
              <p className="font-display text-base text-white">Wise (International)</p>
              <p className="font-body text-xs text-white/45 mt-1">
                {wiseAvailable ? "Send via Wise to the college's recipient email" : "Not available"}
              </p>
            </button>
          </div>
          {!bankAvailable && !wiseAvailable && (
            <p className="text-amber-400 font-body text-xs">No payment methods are currently enabled. Please contact the college finance team.</p>
          )}
        </section>
      )}

      {activeAttempt && (
        <section className="space-y-4">
          <header className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <p className="font-display text-lg text-white">Complete Your Payment</p>
              <p className="text-white/45 font-body text-sm">
                Use the reference and bank details below, then upload your transfer proof.
              </p>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold",
              PAYMENT_ATTEMPT_STATUS_META[activeAttempt.status as keyof typeof PAYMENT_ATTEMPT_STATUS_META].color,
            )}>
              {PAYMENT_ATTEMPT_STATUS_META[activeAttempt.status as keyof typeof PAYMENT_ATTEMPT_STATUS_META].label}
            </span>
          </header>

          {/* Highlight: payment reference */}
          <div className="p-5 rounded-2xl bg-gold-400/[0.08] border border-gold-400/30">
            <p className="text-gold-400 font-body text-[10px] uppercase tracking-widest mb-1">Payment Reference</p>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="font-mono text-xl text-white font-bold">{activeAttempt.payment_reference}</p>
              <button onClick={() => navigator.clipboard.writeText(activeAttempt.payment_reference)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white/70 font-body text-xs hover:bg-white/[0.10] transition-all">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <p className="text-white/55 font-body text-xs mt-2">
              Include this reference in your transfer remark / memo so the college can match the payment.
            </p>
          </div>

          {/* Method-specific instructions */}
          {activeAttempt.payment_method === "bank_transfer" && instructions?.bank_transfer_enabled && (
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center gap-2 mb-3">
                <Landmark className="w-4 h-4 text-gold-400" />
                <p className="font-display text-base text-white">Bank Transfer Details</p>
              </div>
              <CopyableRow label="Bank Name"      value={instructions.bank_name} />
              <CopyableRow label="Account Name"   value={instructions.bank_account_name} />
              <CopyableRow label="Account Number" value={instructions.bank_account_number} />
              <CopyableRow label="SWIFT / BIC"    value={instructions.bank_swift_code} />
              <CopyableRow label="Branch Code"    value={instructions.bank_branch_code} />
              <CopyableRow label="Country"        value={instructions.bank_country} />
              <CopyableRow label="Currency"       value={instructions.bank_currency} />
              <CopyableRow label="Amount"         value={total} />
              {instructions.bank_payment_instructions && (
                <p className="text-white/55 font-body text-xs mt-3 leading-relaxed">{instructions.bank_payment_instructions}</p>
              )}
            </div>
          )}

          {activeAttempt.payment_method === "wise" && instructions?.wise_enabled && (
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center gap-2 mb-3">
                <Globe2 className="w-4 h-4 text-gold-400" />
                <p className="font-display text-base text-white">Wise Transfer Details</p>
              </div>
              <CopyableRow label="Recipient Name"  value={instructions.wise_recipient_name} />
              <CopyableRow label="Recipient Email" value={instructions.wise_recipient_email} />
              <CopyableRow label="Currency"        value={instructions.wise_currency} />
              <CopyableRow label="Amount"          value={total} />
              {instructions.wise_instructions && (
                <p className="text-white/55 font-body text-xs mt-3 leading-relaxed">{instructions.wise_instructions}</p>
              )}
            </div>
          )}

          {/* Proof upload */}
          {activeAttempt.status !== "verified" && (
            <form onSubmit={e => handleProofUpload(activeAttempt.id, e)}
              className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-gold-400" />
                <p className="font-display text-base text-white">Upload Transfer Proof</p>
              </div>
              <p className="text-white/45 font-body text-xs">
                PDF, PNG or JPEG. Max 10 MB. Include the screenshot/receipt that confirms the transfer.
              </p>

              <label className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.15] cursor-pointer hover:border-gold-400/40 transition-colors">
                <FileText className="w-4 h-4 text-white/45" />
                <span className="font-body text-sm text-white/65 flex-1" id={`fl-${activeAttempt.id}`}>Click to select a file</span>
                <input type="file" name="file" required hidden accept={ALLOWED_PROOF_MIME.join(",")}
                  onChange={e => {
                    const el = document.getElementById(`fl-${activeAttempt.id}`);
                    if (el) el.textContent = e.target.files?.[0]?.name ?? "Click to select a file";
                  }} />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/55 font-body text-[10px] uppercase tracking-wider mb-1">Bank/Wise Reference (optional)</label>
                  <input type="text" name="receipt_reference" placeholder="Their transfer ID"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.10] font-body text-sm text-white placeholder-white/35 focus:outline-none focus:border-gold-400/50 transition-colors [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-white/55 font-body text-[10px] uppercase tracking-wider mb-1">Payment Date (optional)</label>
                  <input type="date" name="payment_date"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.10] font-body text-sm text-white placeholder-white/35 focus:outline-none focus:border-gold-400/50 transition-colors [color-scheme:dark]" />
                </div>
              </div>

              <p className="text-white/40 font-body text-[10px]">
                Max upload size {Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB. By submitting you confirm the proof shows a transfer of {total}.
              </p>

              <button type="submit" disabled={uploadingId === activeAttempt.id}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-60 disabled:cursor-wait">
                {uploadingId === activeAttempt.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Upload className="w-4 h-4" />}
                {uploadingId === activeAttempt.id ? "Uploading…" : "Upload Proof"}
              </button>
            </form>
          )}

          {(proofs[activeAttempt.id]?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="text-white/45 font-body text-[11px] uppercase tracking-wider">Uploaded proofs</p>
              {proofs[activeAttempt.id].map(p => (
                <a key={p.id} href={`/api/payment-proofs/${p.id}/download`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-gold-400/30 transition-colors group">
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                    <span className="font-body text-xs text-white/70 truncate">{p.file_name}</span>
                    <span className="font-body text-[10px] text-white/30 flex-shrink-0">{(p.file_size_bytes / 1024).toFixed(0)} KB</span>
                  </span>
                  <Download className="w-3 h-3 text-white/30 group-hover:text-gold-400 transition-colors" />
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {/* History of past attempts (if any beyond active) */}
      {attempts.length > (activeAttempt ? 1 : 0) && (
        <section className="space-y-2 pt-4 border-t border-white/[0.06]">
          <p className="text-white/45 font-body text-[11px] uppercase tracking-wider">Payment History</p>
          {attempts.filter(a => a.id !== activeAttempt?.id).map(att => {
            const m = PAYMENT_ATTEMPT_STATUS_META[att.status as keyof typeof PAYMENT_ATTEMPT_STATUS_META];
            return (
              <div key={att.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div>
                  <p className="font-mono text-xs text-white/70">{att.payment_reference}</p>
                  <p className="font-body text-[10px] text-white/35 mt-0.5">
                    {att.payment_method.replace("_", " ")} · {new Date(att.created_at).toLocaleDateString("en-SG", { dateStyle: "medium" })}
                  </p>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold", m.color)}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
