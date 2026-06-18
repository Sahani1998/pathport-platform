"use client";

import { useEffect } from "react";
import { INVOICE_LINE_TYPE_LABEL, INVOICE_FEE_TYPE_META, type StudentInvoice, type InvoiceLineItem, type Currency, type InvoiceFeeType } from "@/types/payment";

interface Props {
  invoice:              StudentInvoice;
  lines:                InvoiceLineItem[];
  collegeName:          string;
  collegeAddress?:      string | null;
  courseTitle:          string;
  studentName:          string;
  studentEmail:         string;
  studentPublicId:      string | null;
  applicationPublicId:  string | null;
  feeType?:             string | null;
  amountReceivedCents?: number;
  autoPrint?:           boolean;
}

function fmt(cents: number, cur: Currency) {
  return `${cur} ${(cents / 100).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_LABELS: Record<string, string> = {
  draft:               "Draft",
  pending:             "Pending",
  under_verification:  "Under Verification",
  paid:                "Paid",
  partially_paid:      "Partially Paid",
  payment_action_required: "Action Required",
  void:                "Void",
  refunded:            "Refunded",
};

export default function InvoicePrintable({
  invoice, lines, collegeName, courseTitle, studentName, studentEmail,
  studentPublicId, applicationPublicId, feeType, amountReceivedCents, autoPrint,
}: Props) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const issued = invoice.issued_at ? new Date(invoice.issued_at) : new Date();
  const due    = invoice.due_date  ? new Date(invoice.due_date)  : null;
  const cur    = invoice.currency as Currency;

  const feeMeta = feeType ? INVOICE_FEE_TYPE_META[feeType as InvoiceFeeType] : null;
  const statusLabel = STATUS_LABELS[invoice.status] ?? invoice.status;
  const isPaid      = invoice.status === "paid";
  const isPartial   = invoice.status === "partially_paid";
  const received    = amountReceivedCents ?? 0;
  const remaining   = Math.max(0, invoice.amount_cents - received);

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      <style>{`
        @media print {
          @page { margin: 14mm; }
          .no-print { display: none !important; }
        }
        body { color-scheme: light; }
      `}</style>

      <div className="no-print fixed top-4 right-4 z-50">
        <button onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold text-sm shadow-lg hover:bg-gray-700 transition">
          Print / Save as PDF
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-10">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-300 pb-6 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">PathPort</p>
            <h1 className="text-3xl font-bold mt-1">{collegeName}</h1>
            <p className="text-sm text-gray-600 mt-1">Issued via PathPort platform</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-2 flex-wrap">
              {feeMeta && (
                <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, border: "1px solid #d1a836", color: "#b8860b", background: "#fdf8ee" }}>
                  {feeMeta.label}
                </span>
              )}
              <span style={{
                display: "inline-block", padding: "2px 10px", borderRadius: "9999px",
                fontSize: "11px", fontWeight: 600,
                background: isPaid ? "#ecfdf5" : isPartial ? "#fffbeb" : "#f9fafb",
                color:      isPaid ? "#065f46" : isPartial ? "#92400e" : "#374151",
                border:     `1px solid ${isPaid ? "#6ee7b7" : isPartial ? "#fcd34d" : "#d1d5db"}`,
              }}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Invoice</p>
            <p className="text-2xl font-bold font-mono mt-1">{invoice.public_id ?? "(draft)"}</p>
            <p className="text-sm text-gray-600 mt-1">
              {issued.toLocaleDateString("en-SG", { dateStyle: "long" })}
            </p>
          </div>
        </div>

        {/* Bill to */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">{studentName}</p>
            <p className="text-sm text-gray-600">{studentEmail}</p>
            {studentPublicId && <p className="text-sm text-gray-500 mt-1 font-mono">{studentPublicId}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Course</p>
            <p className="font-semibold text-gray-900">{courseTitle}</p>
            {applicationPublicId && <p className="text-sm text-gray-500 mt-1 font-mono">App {applicationPublicId}</p>}
            {due && (
              <p className="text-sm text-gray-700 mt-2">
                <span className="font-semibold">Due:</span> {due.toLocaleDateString("en-SG", { dateStyle: "long" })}
              </p>
            )}
          </div>
        </div>

        {invoice.description && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6 text-sm text-gray-700">
            {invoice.description}
          </div>
        )}

        {/* Line items */}
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 font-semibold text-gray-700">Description</th>
              <th className="text-left py-2 font-semibold text-gray-700 w-32">Type</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-40">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(li => (
              <tr key={li.id} className="border-b border-gray-200">
                <td className="py-3">{li.description}</td>
                <td className="py-3 text-gray-600">{INVOICE_LINE_TYPE_LABEL[li.line_type]}</td>
                <td className={`py-3 text-right font-mono ${li.amount_cents < 0 ? "text-red-600" : ""}`}>
                  {fmt(li.amount_cents, li.currency as Currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td colSpan={2} className="pt-4 text-right font-semibold text-gray-700">Total</td>
              <td className="pt-4 text-right font-bold text-lg font-mono">{fmt(invoice.amount_cents, cur)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Payment summary (paid / partially paid) */}
        {(isPaid || isPartial) && (
          <div className="rounded-lg border mb-8 overflow-hidden" style={{ borderColor: isPaid ? "#6ee7b7" : "#fcd34d" }}>
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ background: isPaid ? "#ecfdf5" : "#fffbeb", color: isPaid ? "#065f46" : "#92400e" }}>
              {isPaid ? "Payment Confirmed" : "Partial Payment Received"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div style={{ padding: "16px", borderRight: "1px solid #e5e7eb" }}>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Invoice Total</p>
                <p className="font-mono font-semibold text-gray-900">{fmt(invoice.amount_cents, cur)}</p>
              </div>
              <div style={{ padding: "16px", borderRight: "1px solid #e5e7eb" }}>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Received</p>
                <p className="font-mono font-semibold" style={{ color: received > 0 ? "#059669" : "#9ca3af" }}>
                  {received > 0 ? fmt(received, cur) : "—"}
                </p>
              </div>
              <div style={{ padding: "16px" }}>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</p>
                <p className="font-mono font-semibold" style={{ color: remaining > 0 ? "#d97706" : "#059669" }}>
                  {remaining > 0 ? fmt(remaining, cur) : "Fully paid"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-gray-200 text-xs text-gray-500 leading-relaxed space-y-1">
          <p>This invoice has been issued by {collegeName} via the PathPort platform.</p>
          <p>Pay via the payment options shown on your PathPort dashboard. Upload your transfer proof there for verification.</p>
          {invoice.public_id && <p className="font-mono mt-2">Ref: {invoice.public_id}</p>}
        </div>
      </div>
    </div>
  );
}
