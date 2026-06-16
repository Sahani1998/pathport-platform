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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Official Receipt {receipt.public_id}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #1a1a1a; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #1a1a1a; }
          .brand { font-size: 22px; font-weight: 800; letter-spacing: .04em; }
          .brand span { color: #C9A84C; }
          .receipt-title { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
          .receipt-number { font-family: monospace; font-size: 15px; color: #444; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #888; margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .row .label { color: #555; }
          .row .value { font-weight: 600; text-align: right; }
          .amount-box { background: #f9f6ef; border: 1px solid #C9A84C; border-radius: 8px; padding: 16px 20px; margin: 24px 0; text-align: center; }
          .amount-label { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #888; margin-bottom: 4px; }
          .amount-value { font-size: 28px; font-weight: 800; color: #1a1a1a; }
          .notes { color: #666; font-size: 13px; margin-top: 8px; }
          .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #aaa; text-align: center; }
          @media print { body { padding: 20px; } .no-print { display: none !important; } }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div>
            <div className="brand">Path<span>Port</span></div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Singapore Diploma Platform</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="receipt-title">Official Receipt</div>
            <div className="receipt-number">{receipt.public_id}</div>
          </div>
        </div>

        <div className="amount-box">
          <div className="amount-label">Amount Receipted</div>
          <div className="amount-value">{amountFormatted}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          <div className="section">
            <div className="section-title">Issued To</div>
            <div className="row"><span className="label">Name</span><span className="value">{studentName}</span></div>
            <div className="row"><span className="label">Email</span><span className="value" style={{ fontSize: "13px" }}>{studentEmail}</span></div>
            <div className="row"><span className="label">Course</span><span className="value">{courseName}</span></div>
          </div>
          <div className="section">
            <div className="section-title">Issued By</div>
            <div className="row"><span className="label">Institution</span><span className="value">{collegeName}</span></div>
            {collegeShortCode && <div className="row"><span className="label">Code</span><span className="value" style={{ fontFamily: "monospace" }}>{collegeShortCode}</span></div>}
            <div className="row"><span className="label">Date Issued</span><span className="value">{issuedDate}</span></div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Payment Details</div>
          {invoice.public_id && <div className="row"><span className="label">Invoice Number</span><span className="value" style={{ fontFamily: "monospace" }}>{invoice.public_id}</span></div>}
          {paymentReference && <div className="row"><span className="label">Payment Reference</span><span className="value" style={{ fontFamily: "monospace" }}>{paymentReference}</span></div>}
          {paymentMethod && <div className="row"><span className="label">Payment Method</span><span className="value">{paymentMethod.replace("_", " ")}</span></div>}
          {paymentDate && <div className="row"><span className="label">Payment Date</span><span className="value">{new Date(paymentDate).toLocaleDateString("en-SG", { dateStyle: "medium" })}</span></div>}
        </div>

        {receipt.notes && <p className="notes">{receipt.notes}</p>}

        <div className="footer">
          This is an official payment receipt issued by {collegeName} via PathPort. Receipt {receipt.public_id}.
        </div>

        <button
          className="no-print"
          onClick={() => window.print()}
          style={{
            position: "fixed", bottom: "24px", right: "24px",
            background: "#1a1a1a", color: "#fff", border: "none",
            padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
            fontSize: "14px", fontWeight: 600,
          }}>
          Print / Save PDF
        </button>
      </body>
    </html>
  );
}
