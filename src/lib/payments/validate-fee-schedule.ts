// Shared validator for fee schedule line items.
// Used by both POST (create) and PATCH (update) routes.

import type { CourseFeeScheduleLine, Currency, InvoiceLineType } from "@/types/payment";

const ALLOWED_CURRENCIES: readonly Currency[] = ["SGD", "USD", "INR", "GBP", "EUR", "AUD"];
const ALLOWED_LINE_TYPES: readonly InvoiceLineType[] = [
  "tuition", "application_fee", "enrollment_fee", "other",
  "scholarship", "discount", "late_fee", "tax",
];

export type ValidateResult =
  | { ok: true;  lines: CourseFeeScheduleLine[] }
  | { ok: false; error: string };

export function validateLineItems(raw: unknown): ValidateResult {
  if (!Array.isArray(raw))   return { ok: false, error: "line_items must be an array" };
  if (raw.length === 0)      return { ok: false, error: "Add at least one line item" };
  if (raw.length > 30)       return { ok: false, error: "Too many line items (max 30)" };

  const lines: CourseFeeScheduleLine[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] as Record<string, unknown>;
    const lt = item?.type;
    const ac = item?.amount_cents;
    const cu = item?.currency;
    const ds = item?.description;

    if (typeof lt !== "string" || !ALLOWED_LINE_TYPES.includes(lt as InvoiceLineType)) {
      return { ok: false, error: `Line ${i + 1}: invalid type` };
    }
    if (typeof ac !== "number" || !Number.isFinite(ac) || !Number.isInteger(ac)) {
      return { ok: false, error: `Line ${i + 1}: amount_cents must be an integer` };
    }
    if (typeof cu !== "string" || !ALLOWED_CURRENCIES.includes(cu as Currency)) {
      return { ok: false, error: `Line ${i + 1}: invalid currency` };
    }
    if (ds !== undefined && ds !== null && typeof ds !== "string") {
      return { ok: false, error: `Line ${i + 1}: description must be a string` };
    }
    lines.push({
      type:         lt as InvoiceLineType,
      amount_cents: ac,
      currency:     cu as Currency,
      description:  ds ? String(ds).trim().slice(0, 200) : undefined,
    });
  }
  return { ok: true, lines };
}
