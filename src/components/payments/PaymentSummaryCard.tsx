// Pure display component — works in both server and client components.
// Shows invoice total / received / remaining for paid and partially_paid invoices.

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { formatCents } from "@/lib/payments/invoice-helpers";
import type { InvoiceStatus, Currency } from "@/types/payment";

interface Props {
  invoiceAmountCents:  number;
  invoiceCurrency:     string;
  amountReceivedCents: number;
  invoiceStatus:       InvoiceStatus;
}

export default function PaymentSummaryCard({
  invoiceAmountCents, invoiceCurrency, amountReceivedCents, invoiceStatus,
}: Props) {
  const cur          = invoiceCurrency as Currency;
  const remaining    = Math.max(0, invoiceAmountCents - amountReceivedCents);
  const isPartial    = invoiceStatus === "partially_paid";
  const isPaid       = invoiceStatus === "paid";

  if (!isPartial && !isPaid) return null;

  return (
    <section className={`rounded-2xl border overflow-hidden ${
      isPartial
        ? "bg-amber-500/[0.05] border-amber-400/25"
        : "bg-emerald-500/[0.05] border-emerald-400/25"
    }`}>
      <div className={`flex items-center gap-2 px-5 py-3 border-b ${
        isPartial ? "border-amber-400/15" : "border-emerald-400/15"
      }`}>
        {isPartial
          ? <AlertTriangle className="w-4 h-4 text-amber-400" />
          : <CheckCircle2  className="w-4 h-4 text-emerald-400" />}
        <p className={`font-display text-sm font-semibold ${isPartial ? "text-amber-400" : "text-emerald-400"}`}>
          {isPartial ? "Partial Payment Received" : "Payment Confirmed"}
        </p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/[0.07]">
        <div className="p-4">
          <p className="text-white/40 font-body text-[10px] uppercase tracking-wider mb-1">Invoice Total</p>
          <p className="font-mono text-sm text-white/85 font-semibold">
            {formatCents(invoiceAmountCents, cur)}
          </p>
        </div>
        <div className="p-4">
          <p className="text-white/40 font-body text-[10px] uppercase tracking-wider mb-1">Received</p>
          <p className={`font-mono text-sm font-semibold ${amountReceivedCents > 0 ? "text-emerald-400" : "text-white/45"}`}>
            {amountReceivedCents > 0 ? formatCents(amountReceivedCents, cur) : "—"}
          </p>
        </div>
        <div className="p-4">
          <p className="text-white/40 font-body text-[10px] uppercase tracking-wider mb-1">Remaining</p>
          <p className={`font-mono text-sm font-semibold ${remaining > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {remaining > 0 ? formatCents(remaining, cur) : "Fully paid"}
          </p>
        </div>
      </div>
    </section>
  );
}
