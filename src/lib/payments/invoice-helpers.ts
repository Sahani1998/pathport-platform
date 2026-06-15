// Shared helpers for invoice line item validation, currency formatting, and
// reading an invoice with its line items + attempts.
//
// Kept in /lib so route handlers stay thin. No DB calls here besides typed
// query helpers — callers pass in their own Supabase client (user or admin).

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Currency, InvoiceLineType, PaymentMethod,
  StudentInvoice, InvoiceLineItem, PaymentAttempt,
} from "@/types/payment";

const ALLOWED_CURRENCIES: readonly Currency[] = ["SGD", "USD", "INR", "GBP", "EUR", "AUD"];
const ALLOWED_LINE_TYPES: readonly InvoiceLineType[] = [
  "tuition", "application_fee", "enrollment_fee", "other",
  "scholarship", "discount", "late_fee", "tax",
];
const ALLOWED_METHODS: readonly PaymentMethod[] = ["bank_transfer", "wise"];

export type InvoiceLineDraft = {
  line_type:    InvoiceLineType;
  description:  string;
  amount_cents: number;
  currency:     Currency;
};

export type ValidateLinesResult =
  | { ok: true;  lines: InvoiceLineDraft[] }
  | { ok: false; error: string };

export function validateInvoiceLines(raw: unknown, invoiceCurrency: Currency): ValidateLinesResult {
  if (!Array.isArray(raw))   return { ok: false, error: "line_items must be an array" };
  if (raw.length === 0)      return { ok: false, error: "Add at least one line item" };
  if (raw.length > 30)       return { ok: false, error: "Too many line items (max 30)" };

  const out: InvoiceLineDraft[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] as Record<string, unknown>;
    const t  = item?.line_type;
    const d  = item?.description;
    const ac = item?.amount_cents;
    const cu = item?.currency ?? invoiceCurrency;

    if (typeof t !== "string" || !ALLOWED_LINE_TYPES.includes(t as InvoiceLineType)) {
      return { ok: false, error: `Line ${i + 1}: invalid line_type` };
    }
    if (typeof d !== "string" || d.trim().length === 0) {
      return { ok: false, error: `Line ${i + 1}: description is required` };
    }
    if (d.length > 500) {
      return { ok: false, error: `Line ${i + 1}: description too long (max 500 chars)` };
    }
    if (typeof ac !== "number" || !Number.isFinite(ac) || !Number.isInteger(ac)) {
      return { ok: false, error: `Line ${i + 1}: amount_cents must be an integer` };
    }
    if (typeof cu !== "string" || !ALLOWED_CURRENCIES.includes(cu as Currency)) {
      return { ok: false, error: `Line ${i + 1}: invalid currency` };
    }
    out.push({
      line_type:    t as InvoiceLineType,
      description:  d.trim(),
      amount_cents: ac,
      currency:     cu as Currency,
    });
  }
  return { ok: true, lines: out };
}

export function validatePaymentMethods(raw: unknown): PaymentMethod[] | null {
  if (!Array.isArray(raw)) return null;
  const out: PaymentMethod[] = [];
  for (const m of raw) {
    if (typeof m !== "string" || !ALLOWED_METHODS.includes(m as PaymentMethod)) return null;
    if (!out.includes(m as PaymentMethod)) out.push(m as PaymentMethod);
  }
  return out;
}

export function isAllowedCurrency(s: unknown): s is Currency {
  return typeof s === "string" && ALLOWED_CURRENCIES.includes(s as Currency);
}

export function formatCents(cents: number, currency: Currency): string {
  return `${currency} ${(cents / 100).toLocaleString("en-SG", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

export interface InvoiceWithRelations {
  invoice: StudentInvoice;
  lines:   InvoiceLineItem[];
  attempts: PaymentAttempt[];
}

// Reads an invoice + its line items + payment attempts in one parallel set.
// Caller provides the client; RLS enforces access (or pass admin client).
export async function readInvoiceWithRelations(
  db: SupabaseClient,
  invoiceId: string,
): Promise<InvoiceWithRelations | null> {
  const [{ data: invoice }, { data: lines }, { data: attempts }] = await Promise.all([
    db.from("student_invoices").select("*").eq("id", invoiceId).maybeSingle(),
    db.from("invoice_line_items").select("*").eq("invoice_id", invoiceId).order("sort_order").order("created_at"),
    db.from("payment_attempts").select("*").eq("invoice_id", invoiceId).order("created_at", { ascending: false }),
  ]);

  if (!invoice) return null;
  return {
    invoice:  invoice as StudentInvoice,
    lines:    (lines    ?? []) as InvoiceLineItem[],
    attempts: (attempts ?? []) as PaymentAttempt[],
  };
}
