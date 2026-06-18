"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, HelpCircle, Loader2, AlertCircle, Receipt,
  ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PAYMENT_ATTEMPT_STATUS_META, type PaymentAttempt, type PaymentProof, type OfficialReceipt, type Currency } from "@/types/payment";
import { formatCents } from "@/lib/payments/invoice-helpers";

const INPUT  = cn(
  "w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.10]",
  "font-body text-sm text-white placeholder-white/35",
  "focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/15",
  "transition-colors",
);
const LABEL  = "block text-white/55 font-body text-[10px] uppercase tracking-wider mb-1.5";
const OPTION_STYLE = { backgroundColor: "#0a1024", color: "#fff" } as const;

const CURRENCIES = ["SGD", "USD", "INR", "GBP", "EUR", "AUD"] as const;

interface Props {
  attempt:  PaymentAttempt;
  proofs:   PaymentProof[];
  receipt:  OfficialReceipt | null;
  invoiceAmountCents: number;
  invoiceCurrency:    string;
}

export default function VerificationPanel({ attempt, proofs, receipt, invoiceAmountCents, invoiceCurrency }: Props) {
  const router = useRouter();
  const [busy, setBusy]       = useState<"verify" | "reject" | "info" | "receipt" | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(attempt.status === "proof_submitted");

  // Verify form state
  const [paidAmountStr, setPaidAmountStr]   = useState<string>("");
  const [paidCurrency, setPaidCurrency]     = useState<string>(invoiceCurrency);
  const [paymentDate, setPaymentDate]       = useState<string>("");
  const [reconcMemo, setReconcMemo]         = useState<string>("");
  const [acceptPartial, setAcceptPartial]   = useState(false);

  // Reject form state
  const [rejectReason, setRejectReason] = useState<string>("");

  // Info request form state
  const [infoMessage, setInfoMessage] = useState<string>("");

  // Receipt upload state
  const [receiptFile, setReceiptFile]   = useState<File | null>(null);
  const [receiptNotes, setReceiptNotes] = useState<string>("");
  const [receiptMode, setReceiptMode]   = useState<"generated" | "uploaded">("generated");

  const isActionable = attempt.status === "proof_submitted";

  // Derived verify state
  const paidAmountNum  = parseFloat(paidAmountStr);
  const paidCents      = !isNaN(paidAmountNum) && paidAmountNum > 0
    ? Math.round(paidAmountNum * 100)
    : null;
  const isPartial      = paidCents !== null && paidCents < invoiceAmountCents;
  const approveEnabled = paidCents !== null && paidCents > 0 && (!isPartial || acceptPartial);

  const doVerify = async () => {
    if (!approveEnabled || !paidCents) return;
    setBusy("verify"); setError(null); setSuccess(null);
    try {
      const res = await fetch(`/api/payment-attempts/${attempt.id}/verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          paid_amount_cents:   paidCents,
          paid_currency:       paidCurrency,
          payment_date:        paymentDate     || undefined,
          reconciliation_memo: reconcMemo      || undefined,
          accept_partial:      isPartial ? true : undefined,
        }),
      });
      const data = await res.json() as {
        error?: string;
        advanced_to_label?: string;
        partial?: boolean;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to verify");
      if (data.partial) {
        setSuccess("Partial payment recorded. Student notified. Issue a receipt only after the full invoice amount is verified.");
      } else {
        setSuccess(
          data.advanced_to_label
            ? `Payment verified. Application advanced to ${data.advanced_to_label}.`
            : "Payment verified.",
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(null);
    }
  };

  const doReject = async () => {
    if (!rejectReason.trim()) { setError("A reason is required"); return; }
    setBusy("reject"); setError(null); setSuccess(null);
    try {
      const res = await fetch(`/api/payment-attempts/${attempt.id}/reject`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to reject");
      setSuccess("Payment rejected. Student notified to re-upload.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setBusy(null);
    }
  };

  const doRequestInfo = async () => {
    if (!infoMessage.trim()) { setError("A message is required"); return; }
    setBusy("info"); setError(null); setSuccess(null);
    try {
      const res = await fetch(`/api/payment-attempts/${attempt.id}/request-info`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: infoMessage.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send request");
      setSuccess("Information request sent to student.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  };

  const doIssueReceipt = async () => {
    setBusy("receipt"); setError(null); setSuccess(null);
    try {
      let res: Response;
      if (receiptMode === "uploaded") {
        if (!receiptFile) { setError("Select a PDF file"); setBusy(null); return; }
        const fd = new FormData();
        fd.append("file", receiptFile);
        if (receiptNotes.trim()) fd.append("notes", receiptNotes.trim());
        res = await fetch(`/api/payment-attempts/${attempt.id}/official-receipt`, { method: "POST", body: fd });
      } else {
        res = await fetch(`/api/payment-attempts/${attempt.id}/official-receipt`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ notes: receiptNotes.trim() || undefined }),
        });
      }
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to issue receipt");
      setSuccess("Official receipt issued. Student notified.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Receipt issuance failed");
    } finally {
      setBusy(null);
    }
  };

  const meta = PAYMENT_ATTEMPT_STATUS_META[attempt.status as keyof typeof PAYMENT_ATTEMPT_STATUS_META];

  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-sm text-white/85 font-semibold">{attempt.payment_reference}</p>
            <span className={cn("px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold", meta.color)}>
              {meta.label}
            </span>
          </div>
          <p className="font-body text-[11px] text-white/40 mt-0.5">
            {attempt.payment_method.replace("_", " ")} · {new Date(attempt.created_at).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })}
            {proofs.length > 0 && <> · {proofs.length} proof{proofs.length > 1 ? "s" : ""}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-white/45 font-body text-sm font-mono">
            {formatCents(invoiceAmountCents, invoiceCurrency as Currency)}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.07] p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 font-body text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
            </div>
          )}

          {/* Proof files */}
          {proofs.length > 0 && (
            <div className="space-y-1">
              <p className={LABEL}>Payment Proofs</p>
              {proofs.map(p => (
                <a key={p.id} href={`/api/payment-proofs/${p.id}/download`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.07] hover:border-gold-400/30 transition-colors group">
                  <div className="min-w-0">
                    <p className="font-body text-xs text-white/70 truncate">{p.file_name}</p>
                    <p className="font-body text-[10px] text-white/35">
                      {(p.file_size_bytes / 1024).toFixed(0)} KB
                      {p.receipt_reference && <> · Ref: {p.receipt_reference}</>}
                      {p.payment_date && <> · {new Date(p.payment_date).toLocaleDateString("en-SG", { dateStyle: "medium" })}</>}
                    </p>
                  </div>
                  <span className="text-white/30 group-hover:text-gold-400 font-body text-[10px] transition-colors">Download</span>
                </a>
              ))}
            </div>
          )}

          {/* Rejection reason / info request display */}
          {attempt.rejection_reason && (
            <div className="p-3 rounded-xl bg-red-500/[0.05] border border-red-500/20">
              <p className={LABEL + " text-red-400/70"}>Rejection Reason</p>
              <p className="font-body text-sm text-red-300/80">{attempt.rejection_reason}</p>
            </div>
          )}
          {attempt.info_request_message && (
            <div className="p-3 rounded-xl bg-amber-500/[0.05] border border-amber-400/20">
              <p className={LABEL + " text-amber-400/70"}>Info Requested</p>
              <p className="font-body text-sm text-amber-200/80">{attempt.info_request_message}</p>
            </div>
          )}

          {/* Verification form */}
          {isActionable && (
            <>
              {/* ── VERIFY ── */}
              <div className="p-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-400/20 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-display text-base text-emerald-400">Approve Payment</p>
                  <span className="font-body text-xs text-white/50">
                    Invoice: <span className="text-gold-400 font-mono font-semibold">{formatCents(invoiceAmountCents, invoiceCurrency as Currency)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL}>
                      Paid Amount <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number" step="0.01" min="0.01"
                      placeholder={`e.g. ${(invoiceAmountCents / 100).toFixed(2)}`}
                      value={paidAmountStr}
                      onChange={e => { setPaidAmountStr(e.target.value); setAcceptPartial(false); }}
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>
                      Paid Currency <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={paidCurrency}
                      onChange={e => setPaidCurrency(e.target.value)}
                      className={INPUT}
                    >
                      {CURRENCIES.map(c => (
                        <option key={c} value={c} style={OPTION_STYLE}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={e => setPaymentDate(e.target.value)}
                      className={INPUT + " [color-scheme:dark]"}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Reconciliation Notes</label>
                  <input type="text" placeholder="Internal notes for your records"
                    value={reconcMemo} onChange={e => setReconcMemo(e.target.value)}
                    className={INPUT} />
                </div>

                {/* Partial payment warning */}
                {isPartial && (
                  <div className="p-3 rounded-xl bg-amber-500/[0.08] border border-amber-400/25 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-body text-xs text-amber-300 font-semibold">
                          Amount received ({paidCurrency} {paidAmountNum.toFixed(2)}) is less than the invoice amount ({invoiceCurrency} {(invoiceAmountCents / 100).toFixed(2)}).
                        </p>
                        <p className="font-body text-[11px] text-amber-200/65 mt-1">
                          Partial payments do not advance the application stage and cannot receive an official receipt until the full invoice amount is verified.
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={acceptPartial}
                        onChange={e => setAcceptPartial(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-amber-400"
                      />
                      <span className="font-body text-xs text-amber-300">Accept as partial payment</span>
                    </label>
                  </div>
                )}

                <button
                  onClick={doVerify}
                  disabled={busy !== null || !approveEnabled}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy === "verify"
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />}
                  {busy === "verify"
                    ? "Approving…"
                    : isPartial ? "Accept Partial Payment" : "Approve Payment"}
                </button>
              </div>

              {/* ── REQUEST INFO ── */}
              <div className="p-4 rounded-xl bg-amber-500/[0.05] border border-amber-400/20 space-y-3">
                <p className="font-display text-base text-amber-400">Request More Information</p>
                <div>
                  <label className={LABEL}>Message to student</label>
                  <textarea rows={2} placeholder="Describe what additional information is needed…"
                    value={infoMessage} onChange={e => setInfoMessage(e.target.value)}
                    className={INPUT + " resize-y"} />
                </div>
                <button onClick={doRequestInfo} disabled={busy !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 font-body text-sm font-semibold hover:bg-amber-400/20 transition-all disabled:opacity-60 disabled:cursor-wait">
                  {busy === "info" ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                  {busy === "info" ? "Sending…" : "Request Info"}
                </button>
              </div>

              {/* ── REJECT ── */}
              <div className="p-4 rounded-xl bg-red-500/[0.05] border border-red-400/20 space-y-3">
                <p className="font-display text-base text-red-400">Reject Payment</p>
                <div>
                  <label className={LABEL}>Reason (shown to student)</label>
                  <textarea rows={2} placeholder="Explain why the proof cannot be accepted…"
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    className={INPUT + " resize-y"} />
                </div>
                <button onClick={doReject} disabled={busy !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-400/30 text-red-400 font-body text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-60 disabled:cursor-wait">
                  {busy === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  {busy === "reject" ? "Rejecting…" : "Reject Payment"}
                </button>
              </div>
            </>
          )}

          {/* Official receipt section */}
          {attempt.status === "verified" && (
            <div className="p-4 rounded-xl bg-pathBlue-500/[0.06] border border-pathBlue-500/20 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-base text-pathBlue-300">Official Receipt</p>
                {receipt && (
                  <a href={`/api/official-receipts/${receipt.id}/download`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pathBlue-400/30 text-pathBlue-300 font-body text-xs hover:bg-pathBlue-500/10 transition-all">
                    Download {receipt.public_id}
                  </a>
                )}
              </div>

              {receipt ? (
                <p className="font-body text-sm text-pathBlue-200/70">
                  Receipt {receipt.public_id} issued {new Date(receipt.issued_at).toLocaleDateString("en-SG", { dateStyle: "medium" })}.
                  {receipt.notes && <> · {receipt.notes}</>}
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="font-body text-xs text-white/50">No receipt issued yet. Issue one now:</p>
                  <div className="flex gap-2">
                    {(["generated", "uploaded"] as const).map(mode => (
                      <button key={mode} onClick={() => setReceiptMode(mode)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg font-body text-xs font-semibold border transition-all",
                          receiptMode === mode
                            ? "bg-pathBlue-500/20 border-pathBlue-400/40 text-pathBlue-300"
                            : "bg-white/[0.04] border-white/[0.08] text-white/45 hover:text-white/70",
                        )}>
                        {mode === "generated" ? "Generate" : "Upload PDF"}
                      </button>
                    ))}
                  </div>
                  {receiptMode === "uploaded" && (
                    <div>
                      <label className={LABEL}>Receipt PDF</label>
                      <label className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.15] cursor-pointer hover:border-pathBlue-400/40 transition-colors">
                        <Receipt className="w-4 h-4 text-white/40" />
                        <span className="font-body text-sm text-white/60 flex-1">
                          {receiptFile ? receiptFile.name : "Click to select PDF"}
                        </span>
                        <input type="file" accept="application/pdf" hidden
                          onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  )}
                  <div>
                    <label className={LABEL}>Notes (optional)</label>
                    <input type="text" placeholder="Internal notes for this receipt"
                      value={receiptNotes} onChange={e => setReceiptNotes(e.target.value)}
                      className={INPUT} />
                  </div>
                  <button onClick={doIssueReceipt} disabled={busy !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pathBlue-500/15 border border-pathBlue-400/30 text-pathBlue-300 font-body text-sm font-semibold hover:bg-pathBlue-500/25 transition-all disabled:opacity-60 disabled:cursor-wait">
                    {busy === "receipt" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                    {busy === "receipt" ? "Issuing…" : "Issue Official Receipt"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
