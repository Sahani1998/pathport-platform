"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Save, Send, Loader2, AlertCircle, Upload, FileText,
  Receipt, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INVOICE_LINE_TYPE_LABEL,
  type CourseFeeSchedule, type CourseFeeScheduleLine,
  type Currency, type InvoiceLineType, type PaymentMethod, type StudentInvoice,
} from "@/types/payment";

const CURRENCIES: Currency[] = ["SGD", "USD", "INR", "GBP", "EUR", "AUD"];
const LINE_TYPES: InvoiceLineType[] = [
  "tuition", "application_fee", "enrollment_fee", "other",
  "scholarship", "discount", "late_fee", "tax",
];

const INPUT = cn(
  "w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.10]",
  "font-body text-sm text-white placeholder-white/35",
  "focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/15",
  "transition-colors [color-scheme:dark]",
);
const LABEL = "block text-white/55 font-body text-[10px] uppercase tracking-wider mb-1.5";
const OPTION_STYLE = { backgroundColor: "#0a1024", color: "#fff" } as const;

interface Props {
  applicationId:   string;
  defaultCurrency: Currency;
  feeSchedules:    CourseFeeSchedule[];
  onCreated:       (invoice: StudentInvoice) => void;
  onCancel:        () => void;
}

type LineDraft = {
  line_type:    InvoiceLineType;
  description:  string;
  amount_cents: number;
  amount_display: string;
  currency:     Currency;
};

function schedToLines(s: CourseFeeSchedule): LineDraft[] {
  return s.line_items.map((li: CourseFeeScheduleLine) => ({
    line_type:      li.type,
    description:    li.description ?? INVOICE_LINE_TYPE_LABEL[li.type],
    amount_cents:   li.amount_cents,
    amount_display: (li.amount_cents / 100).toFixed(2),
    currency:       li.currency,
  }));
}

function emptyLine(currency: Currency): LineDraft {
  return {
    line_type: "tuition",
    description: "Tuition fee",
    amount_cents: 0,
    amount_display: "0.00",
    currency,
  };
}

export default function IssueInvoiceForm({
  applicationId, defaultCurrency, feeSchedules, onCreated, onCancel,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"generated" | "uploaded">("generated");
  const [error,  setError]  = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Pre-pick default schedule on mount.
  const defaultSched = feeSchedules.find(s => s.is_default) ?? feeSchedules[0] ?? null;

  // ── Generated state ──
  const [scheduleId, setScheduleId] = useState(defaultSched?.id ?? "");
  const [currency,   setCurrency]   = useState<Currency>(defaultCurrency);
  const [dueDate,    setDueDate]    = useState("");
  const [description, setDescription] = useState("");
  const [methods,    setMethods]    = useState<PaymentMethod[]>(["bank_transfer", "wise"]);
  const [lines,      setLines]      = useState<LineDraft[]>(
    defaultSched ? schedToLines(defaultSched) : [emptyLine(defaultCurrency)],
  );

  // ── Uploaded state ──
  const [file,        setFile]        = useState<File | null>(null);
  const [uploadAmount, setUploadAmount] = useState("");
  const [externalRef, setExternalRef] = useState("");

  const setLine = (i: number, patch: Partial<LineDraft>) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const addLine    = () => setLines(ls => [...ls, emptyLine(currency)]);

  const applySchedule = (id: string) => {
    setScheduleId(id);
    const s = feeSchedules.find(x => x.id === id);
    if (s) {
      setLines(schedToLines(s));
      if (s.line_items[0]?.currency) setCurrency(s.line_items[0].currency);
    }
  };

  const toggleMethod = (m: PaymentMethod) =>
    setMethods(arr => arr.includes(m) ? arr.filter(x => x !== m) : [...arr, m]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (methods.length === 0) { setError("Select at least one payment method"); return; }

    setSaving(true);
    try {
      let res: Response;
      if (mode === "generated") {
        if (lines.length === 0) throw new Error("Add at least one line item");
        const payload = {
          currency,
          description: description.trim() || null,
          due_date:    dueDate || null,
          payment_methods_allowed: methods,
          line_items:  lines.map((l, idx) => {
            const n = Number(l.amount_display);
            if (!Number.isFinite(n)) throw new Error(`Line ${idx + 1}: invalid amount`);
            if (!l.description.trim()) throw new Error(`Line ${idx + 1}: description required`);
            return {
              line_type:    l.line_type,
              description:  l.description,
              amount_cents: Math.round(n * 100),
              currency:     l.currency,
            };
          }),
        };
        res = await fetch(`/api/applications/${applicationId}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
      } else {
        if (!file) throw new Error("Select a PDF file");
        const n = Number(uploadAmount);
        if (!Number.isFinite(n) || n < 0) throw new Error("Invalid amount");
        const form = new FormData();
        form.append("file", file);
        form.append("amount_cents", String(Math.round(n * 100)));
        form.append("currency", currency);
        if (dueDate)     form.append("due_date", dueDate);
        if (description) form.append("description", description.trim());
        if (externalRef) form.append("external_invoice_number", externalRef.trim());
        methods.forEach(m => form.append("payment_method", m));
        res = await fetch(`/api/applications/${applicationId}/invoices`, {
          method: "POST",
          body:   form,
        });
      }
      const data = await res.json() as { invoice?: StudentInvoice; error?: string };
      if (!res.ok || !data.invoice) throw new Error(data.error ?? "Failed to create invoice");
      onCreated(data.invoice);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  const totalCents = lines.reduce((sum, l) => {
    const n = Number(l.amount_display);
    return sum + (Number.isFinite(n) ? Math.round(n * 100) : 0);
  }, 0);
  const totalClamped = Math.max(0, totalCents);
  const totalDisplay = `${currency} ${(totalClamped / 100).toLocaleString("en-SG", { minimumFractionDigits: 2 })}`;

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white/[0.05] border border-gold-400/20 space-y-5">

      <div className="flex items-center justify-between">
        <p className="font-body text-sm font-semibold text-white/80">Issue Invoice</p>
        <button type="button" onClick={onCancel} className="text-white/30 hover:text-white/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2">
        {([
          { key: "generated", label: "Generate", icon: Receipt },
          { key: "uploaded",  label: "Upload PDF", icon: Upload },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key} type="button"
            onClick={() => setMode(key)}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border font-body text-sm transition-all",
              mode === key
                ? "bg-gold-400/15 border-gold-400/40 text-gold-400"
                : "bg-white/[0.03] border-white/[0.08] text-white/45 hover:text-white/65",
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Common: description + due date + methods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className={INPUT}>
            {CURRENCIES.map(c => <option key={c} value={c} style={OPTION_STYLE}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Due Date (optional)</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={INPUT} />
        </div>
      </div>

      {/* ── Generated path ─────────────────────────────────────────────── */}
      {mode === "generated" && (
        <div className="space-y-3">
          {feeSchedules.length > 0 && (
            <div>
              <label className={LABEL}>Apply Fee Schedule Template</label>
              <select value={scheduleId} onChange={e => applySchedule(e.target.value)} className={INPUT}>
                <option value=""  style={OPTION_STYLE}>— Custom —</option>
                {feeSchedules.map(s => (
                  <option key={s.id} value={s.id} style={OPTION_STYLE}>{s.name}{s.is_default ? " (default)" : ""}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-white/55 font-body text-xs font-semibold uppercase tracking-wider">Line Items</p>
            <button type="button" onClick={addLine}
              className="flex items-center gap-1.5 text-gold-400/80 hover:text-gold-300 font-body text-xs transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          </div>

          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-3">
                    <label className={LABEL}>Type</label>
                    <select value={line.line_type} onChange={e => setLine(idx, { line_type: e.target.value as InvoiceLineType })} className={INPUT}>
                      {LINE_TYPES.map(t => <option key={t} value={t} style={OPTION_STYLE}>{INVOICE_LINE_TYPE_LABEL[t]}</option>)}
                    </select>
                  </div>
                  <div className="col-span-12 sm:col-span-5">
                    <label className={LABEL}>Description *</label>
                    <input value={line.description} onChange={e => setLine(idx, { description: e.target.value })}
                      placeholder="e.g. Semester 1 tuition" className={INPUT} required />
                  </div>
                  <div className="col-span-7 sm:col-span-3">
                    <label className={LABEL}>Amount</label>
                    <input type="text" inputMode="decimal" value={line.amount_display}
                      onChange={e => setLine(idx, { amount_display: e.target.value })}
                      placeholder="0.00" className={INPUT} />
                  </div>
                  <div className="col-span-5 sm:col-span-1 flex justify-end">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)}
                        className="p-2 rounded-lg text-white/30 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-white/65 font-body text-sm pt-2 border-t border-white/[0.06]">
            <span className="text-white/40 uppercase tracking-wider text-[11px]">Total</span>
            <span className="font-semibold text-gold-400">{totalDisplay}</span>
          </div>
        </div>
      )}

      {/* ── Uploaded path ──────────────────────────────────────────────── */}
      {mode === "uploaded" && (
        <div className="space-y-3">
          <div>
            <label className={LABEL}>Invoice PDF *</label>
            <label className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.15] cursor-pointer hover:border-gold-400/40 transition-colors">
              <FileText className="w-4 h-4 text-white/45" />
              <span className="font-body text-sm text-white/65 flex-1">
                {file ? file.name : "Click to select PDF (max 10 MB)"}
              </span>
              <input type="file" accept="application/pdf" hidden onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Amount Due *</label>
              <input type="text" inputMode="decimal" value={uploadAmount}
                onChange={e => setUploadAmount(e.target.value)} placeholder="0.00" className={INPUT} required />
            </div>
            <div>
              <label className={LABEL}>College Invoice Number (optional)</label>
              <input value={externalRef} onChange={e => setExternalRef(e.target.value)}
                placeholder="e.g. INV/2026/12345" className={INPUT} />
            </div>
          </div>
        </div>
      )}

      {/* Description + payment methods (common) */}
      <div>
        <label className={LABEL}>Notes for Student (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Any extra notes shown on the invoice"
          className={cn(INPUT, "min-h-[70px] resize-y")} />
      </div>

      <div>
        <p className={LABEL}>Payment Methods Allowed *</p>
        <div className="flex gap-3">
          {(["bank_transfer", "wise"] as PaymentMethod[]).map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={methods.includes(m)} onChange={() => toggleMethod(m)} className="w-4 h-4 accent-gold-400" />
              <span className="text-white/70 font-body text-sm capitalize">{m.replace("_", " ")}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-white/[0.1] text-white/50 font-body text-sm hover:text-white/70 transition-all">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Draft"}
        </button>
      </div>

      <p className="text-white/55 font-body text-[11px] text-center">
        <Send className="w-3 h-3 inline mr-1" /> The invoice is saved as a draft. Review and click <strong>Issue</strong> to send it to the student.
      </p>
    </form>
  );
}
