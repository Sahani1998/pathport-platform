"use client";

import { useEffect } from "react";
import type { OfficialReceipt, StudentInvoice } from "@/types/payment";

interface Props {
  receipt:          OfficialReceipt;
  invoice:          StudentInvoice;
  studentName:      string;
  studentEmail:     string;
  collegeName:      string;
  collegeShortCode: string;
  courseName:       string;
  paymentReference: string;
  paymentMethod:    string;
  paymentDate:      string | null;
  amountFormatted:  string;
  autoPrint:        boolean;
}

function Row({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee", fontSize: small ? "13px" : "14px" }}>
      <span style={{ color: "#555" }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right", fontFamily: mono ? "monospace" : undefined }}>{value}</span>
    </div>
  );
}

export default function ReceiptPrintable({
  receipt, invoice, studentName, studentEmail, collegeName, collegeShortCode,
  courseName, paymentReference, paymentMethod, paymentDate, amountFormatted, autoPrint,
}: Props) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const issuedDate = new Date(receipt.issued_at).toLocaleDateString("en-SG", { dateStyle: "long" });

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#fff", color: "#1a1a1a", minHeight: "100vh", padding: "40px", colorScheme: "light" }}>
      <style>{`
        @media print {
          @page { margin: 14mm; }
          .rp-no-print { display: none !important; }
        }
      `}</style>

      <button
        className="rp-no-print"
        onClick={() => window.print()}
        style={{
          position: "fixed", top: "20px", right: "20px",
          background: "#1a1a1a", color: "#fff", border: "none",
          padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
          fontSize: "14px", fontWeight: 600, zIndex: 50,
        }}>
        Print / Save PDF
      </button>

      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1a1a1a", paddingBottom: "24px", marginBottom: "32px" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: ".04em" }}>
              Path<span style={{ color: "#C9A84C" }}>Port</span>
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Singapore Diploma Platform</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: 700 }}>Official Receipt</div>
            <div style={{ fontFamily: "monospace", fontSize: "15px", color: "#444" }}>{receipt.public_id}</div>
          </div>
        </div>

        {/* Amount box */}
        <div style={{ background: "#f9f6ef", border: "1px solid #C9A84C", borderRadius: "8px", padding: "16px 20px", marginBottom: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".1em", color: "#888", marginBottom: "4px" }}>Amount Receipted</div>
          <div style={{ fontSize: "28px", fontWeight: 800 }}>{amountFormatted}</div>
        </div>

        {/* 2-column details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".1em", color: "#888", marginBottom: "8px" }}>Issued To</div>
            <Row label="Name"   value={studentName} />
            <Row label="Email"  value={studentEmail} small />
            <Row label="Course" value={courseName} />
          </div>
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".1em", color: "#888", marginBottom: "8px" }}>Issued By</div>
            <Row label="Institution" value={collegeName} />
            {collegeShortCode && <Row label="Code" value={collegeShortCode} mono />}
            <Row label="Date Issued" value={issuedDate} />
          </div>
        </div>

        {/* Payment details */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: ".1em", color: "#888", marginBottom: "8px" }}>Payment Details</div>
          {invoice.public_id && <Row label="Invoice Number"    value={invoice.public_id} mono />}
          {paymentReference  && <Row label="Payment Reference" value={paymentReference} mono />}
          {paymentMethod     && <Row label="Payment Method"    value={paymentMethod.replace(/_/g, " ")} />}
          {paymentDate       && <Row label="Payment Date"      value={new Date(paymentDate).toLocaleDateString("en-SG", { dateStyle: "medium" })} />}
        </div>

        {receipt.notes && (
          <p style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>{receipt.notes}</p>
        )}

        <div style={{ marginTop: "48px", paddingTop: "20px", borderTop: "1px solid #ddd", fontSize: "11px", color: "#aaa", textAlign: "center" }}>
          This is an official payment receipt issued by {collegeName} via PathPort. Receipt {receipt.public_id}.
        </div>
      </div>
    </div>
  );
}
