"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Receipt, Send, FileX2, Download, Eye, Loader2, AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import IssueInvoiceForm from "./IssueInvoiceForm";
import {
  INVOICE_STATUS_META, INVOICE_FEE_TYPE_META,
  type StudentInvoice, type CourseFeeSchedule, type Currency,
} from "@/types/payment";
import { formatCents } from "@/lib/payments/invoice-helpers";
import type { ApplicationStage } from "@/types/timeline";

interface Props {
  applicationId:   string;
  invoices:        StudentInvoice[];
  feeSchedules:    CourseFeeSchedule[];
  defaultCurrency: Currency;
  currentStage?:   ApplicationStage | null;
  detailHrefBase:  string;
}

export default function InvoiceListClient({
  applicationId, invoices: initial, feeSchedules, defaultCurrency, currentStage, detailHrefBase,
}: Props) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [busyId,   setBusyId]   = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  const handleCreated = (inv: StudentInvoice) => {
    setInvoices(prev => [inv, ...prev]);
    setCreating(false);
  };

  const handleIssue = async (inv: StudentInvoice) => {
    if (!confirm(`Issue invoice to student? This will assign an invoice number and notify them.`)) return;
    setBusyId(inv.id);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/issue`, { method: "POST" });
      const data = await res.json() as { invoice?: StudentInvoice; error?: string };
      if (!res.ok || !data.invoice) throw new Error(data.error ?? "Failed to issue");
      setInvoices(prev => prev.map(i => i.id === inv.id ? data.invoice! : i));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue");
    } finally {
      setBusyId(null);
    }
  };

  const handleVoid = async (inv: StudentInvoice) => {
    const isDraft = inv.status === "draft";
    const reason = isDraft ? "" : prompt("Reason for voiding this invoice (required):") ?? "";
    if (!isDraft && !reason.trim()) return;
    if (!confirm(isDraft ? `Delete draft invoice?` : `Void invoice ${inv.public_id ?? ""}?`)) return;
    setBusyId(inv.id);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason }),
      });
      const data = await res.json() as { invoice?: StudentInvoice; error?: string };
      if (!res.ok || !data.invoice) throw new Error(data.error ?? "Failed to void");
      setInvoices(prev => prev.map(i => i.id === inv.id ? data.invoice! : i));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to void");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="font-display text-xl text-white">Invoices</p>
        {!creating && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all">
            <Plus className="w-4 h-4" /> Issue Invoice
          </button>
        )}
      </header>

      {creating && (
        <IssueInvoiceForm
          applicationId={applicationId}
          defaultCurrency={defaultCurrency}
          feeSchedules={feeSchedules}
          currentStage={currentStage}
          onCreated={handleCreated}
          onCancel={() => setCreating(false)}
        />
      )}

      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {invoices.length === 0 && !creating ? (
        <div className="flex flex-col items-center py-12 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/30">
          <Receipt className="w-9 h-9 mb-2" />
          <p className="font-body text-sm">No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => {
            const meta = INVOICE_STATUS_META[inv.status];
            const isDraft = inv.status === "draft";
            const isVoid  = inv.status === "void";
            const isPaid  = inv.status === "paid";
            return (
              <div key={inv.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-body font-semibold text-sm text-white/85 font-mono">{inv.public_id ?? "(draft)"}</p>
                    {inv.fee_type && (
                      <span className={cn("px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold", INVOICE_FEE_TYPE_META[inv.fee_type].color)}>
                        {INVOICE_FEE_TYPE_META[inv.fee_type].short}
                      </span>
                    )}
                    <span className={cn("px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold", meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-white/35 font-body text-[11px]">
                      {inv.source === "uploaded" ? "Uploaded" : "Generated"}
                    </span>
                  </div>
                  <p className="font-body text-xs text-white/45">
                    {formatCents(inv.amount_cents, inv.currency)}
                    {inv.due_date && <> · due {new Date(inv.due_date).toLocaleDateString("en-SG", { dateStyle: "medium" })}</>}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`${detailHrefBase}/${inv.id}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
                    <Eye className="w-3 h-3" /> View
                  </Link>
                  {!isDraft && (
                    <a href={`/api/invoices/${inv.id}/download`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
                      <Download className="w-3 h-3" /> Download
                    </a>
                  )}
                  {isDraft && (
                    <button onClick={() => handleIssue(inv)} disabled={busyId === inv.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 font-body text-xs font-semibold hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                      {busyId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Issue
                    </button>
                  )}
                  {!isVoid && !isPaid && (
                    <button onClick={() => handleVoid(inv)} disabled={busyId === inv.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-white/30 font-body text-xs hover:text-red-400 hover:border-red-400/25 transition-all disabled:opacity-50">
                      {busyId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileX2 className="w-3 h-3" />}
                      {isDraft ? "Discard" : "Void"}
                    </button>
                  )}
                  {isPaid && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-xs">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
