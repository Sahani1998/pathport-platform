"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, X, Trash2, Save, Loader2, AlertCircle, Pencil, Star,
  StickyNote, Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INVOICE_LINE_TYPE_LABEL,
  type CourseFeeSchedule, type CourseFeeScheduleLine,
  type Currency, type InvoiceLineType,
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
  courseId:    string;
  courseTitle: string;
  schedules:   CourseFeeSchedule[];
  currencyDefault: Currency;
}

type DraftLine = CourseFeeScheduleLine & { amount_display: string };

type DraftSchedule = {
  id?:             string;        // present = edit, absent = new
  name:            string;
  is_default:      boolean;
  due_offset_days: number;
  lines:           DraftLine[];
};

function toDraft(s: CourseFeeSchedule): DraftSchedule {
  return {
    id:              s.id,
    name:            s.name,
    is_default:      s.is_default,
    due_offset_days: s.due_offset_days,
    lines: s.line_items.map(li => ({
      ...li,
      amount_display: (li.amount_cents / 100).toFixed(2),
    })),
  };
}

function newDraft(currency: Currency): DraftSchedule {
  return {
    name:            "",
    is_default:      false,
    due_offset_days: 14,
    lines: [
      { type: "tuition", amount_cents: 0, currency, amount_display: "0.00" },
    ],
  };
}

function formatAmount(cents: number) {
  return (cents / 100).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FeeScheduleEditor({ courseId, courseTitle, schedules: initial, currencyDefault }: Props) {
  const router = useRouter();
  const [schedules, setSchedules] = useState(initial);
  const [draft,     setDraft]     = useState<DraftSchedule | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [busyId,    setBusyId]    = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const openCreate = () => { setDraft(newDraft(currencyDefault)); setError(null); };
  const openEdit   = (s: CourseFeeSchedule) => { setDraft(toDraft(s)); setError(null); };
  const closeForm  = () => { setDraft(null); setError(null); };

  const setLine = (idx: number, patch: Partial<DraftLine>) => {
    setDraft(d => {
      if (!d) return d;
      const lines = d.lines.slice();
      lines[idx] = { ...lines[idx], ...patch };
      return { ...d, lines };
    });
  };

  const addLine = () => {
    setDraft(d => d ? { ...d, lines: [...d.lines, { type: "other", amount_cents: 0, currency: currencyDefault, amount_display: "0.00" }] } : d);
  };
  const removeLine = (idx: number) => {
    setDraft(d => d ? { ...d, lines: d.lines.filter((_, i) => i !== idx) } : d);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    setSaving(true);

    try {
      // Convert amount_display strings to cents
      const lines: CourseFeeScheduleLine[] = draft.lines.map(l => {
        const n = Number(l.amount_display);
        if (!Number.isFinite(n)) throw new Error(`Invalid amount: ${l.amount_display}`);
        return {
          type:         l.type,
          amount_cents: Math.round(n * 100),
          currency:     l.currency,
          description:  l.description,
        };
      });

      const payload = {
        name:            draft.name,
        is_default:      draft.is_default,
        due_offset_days: draft.due_offset_days,
        line_items:      lines,
      };

      const url    = draft.id ? `/api/fee-schedules/${draft.id}` : `/api/courses/${courseId}/fee-schedules`;
      const method = draft.id ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json() as { schedule?: CourseFeeSchedule; error?: string };
      if (!res.ok || !data.schedule) throw new Error(data.error ?? "Failed to save");

      const saved = data.schedule;
      setSchedules(prev => {
        // If this is now the default, clear is_default on siblings client-side too.
        const cleared = saved.is_default ? prev.map(s => ({ ...s, is_default: s.id === saved.id })) : prev;
        const exists  = cleared.some(s => s.id === saved.id);
        return exists ? cleared.map(s => s.id === saved.id ? saved : s) : [...cleared, saved];
      });
      setDraft(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: CourseFeeSchedule) => {
    if (!confirm(`Delete fee schedule "${s.name}"? This cannot be undone.`)) return;
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/fee-schedules/${s.id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setSchedules(prev => prev.filter(x => x.id !== s.id));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const computeTotal = (lines: { amount_cents: number; currency: Currency }[]) => {
    const byCurrency = new Map<Currency, number>();
    for (const l of lines) byCurrency.set(l.currency, (byCurrency.get(l.currency) ?? 0) + l.amount_cents);
    return Array.from(byCurrency.entries()).map(([cur, cents]) => `${cur} ${formatAmount(Math.max(0, cents))}`).join(" + ");
  };

  return (
    <div className="space-y-5">

      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-pathBlue-400 font-body text-[11px] font-semibold uppercase tracking-wider mb-1">{courseTitle}</p>
          <h2 className="font-display text-3xl text-white">Fee Schedule Templates</h2>
          <p className="text-white/40 font-body text-sm mt-1">
            Define one or more pricing templates. When you issue an invoice, the default template auto-fills the line items.
          </p>
        </div>
        {!draft && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all">
            <Plus className="w-4 h-4" /> New Schedule
          </button>
        )}
      </header>

      {/* Editor */}
      {draft && (
        <form onSubmit={handleSave} className="p-5 rounded-2xl bg-white/[0.05] border border-gold-400/20 space-y-5">
          <div className="flex items-center justify-between">
            <p className="font-body text-sm font-semibold text-white/80">{draft.id ? "Edit Schedule" : "New Schedule"}</p>
            <button type="button" onClick={closeForm} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={LABEL}>Template Name *</label>
              <input value={draft.name}
                onChange={e => setDraft(d => d ? { ...d, name: e.target.value } : d)}
                placeholder="e.g. Standard Tuition Plan" className={INPUT} required />
            </div>
            <div>
              <label className={LABEL}>Due Offset (days) *</label>
              <input type="number" min={0} max={365} value={draft.due_offset_days}
                onChange={e => setDraft(d => d ? { ...d, due_offset_days: Number(e.target.value || 0) } : d)}
                className={INPUT} required />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.is_default}
              onChange={e => setDraft(d => d ? { ...d, is_default: e.target.checked } : d)}
              className="w-4 h-4 accent-gold-400"
            />
            <span className="text-white/70 font-body text-sm">Set as default for this course</span>
          </label>

          {/* Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white/55 font-body text-xs font-semibold uppercase tracking-wider">Line Items</p>
              <button type="button" onClick={addLine}
                className="flex items-center gap-1.5 text-gold-400/80 hover:text-gold-300 font-body text-xs transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            <div className="space-y-2">
              {draft.lines.map((line, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-3">
                      <label className={LABEL}>Type</label>
                      <select value={line.type} onChange={e => setLine(idx, { type: e.target.value as InvoiceLineType })} className={INPUT}>
                        {LINE_TYPES.map(t => <option key={t} value={t} style={OPTION_STYLE}>{INVOICE_LINE_TYPE_LABEL[t]}</option>)}
                      </select>
                    </div>
                    <div className="col-span-7 sm:col-span-4">
                      <label className={LABEL}>Amount</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={line.amount_display}
                        onChange={e => setLine(idx, { amount_display: e.target.value })}
                        placeholder="0.00"
                        className={INPUT}
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <label className={LABEL}>Currency</label>
                      <select value={line.currency} onChange={e => setLine(idx, { currency: e.target.value as Currency })} className={INPUT}>
                        {CURRENCIES.map(c => <option key={c} value={c} style={OPTION_STYLE}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <label className={LABEL}>Description (optional)</label>
                      <input
                        value={line.description ?? ""}
                        onChange={e => setLine(idx, { description: e.target.value || undefined })}
                        placeholder="e.g. Semester 1 tuition"
                        className={INPUT}
                      />
                    </div>
                  </div>
                  {draft.lines.length > 1 && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => removeLine(idx)}
                        className="flex items-center gap-1 text-white/30 hover:text-red-400 font-body text-[11px] transition-colors">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={closeForm}
              className="px-4 py-2 rounded-xl border border-white/[0.1] text-white/50 font-body text-sm hover:text-white/70 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : draft.id ? "Save Changes" : "Create Schedule"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {schedules.length === 0 && !draft ? (
        <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/45">
          <Receipt className="w-10 h-10 mb-3 opacity-60" />
          <p className="font-body text-sm">No fee schedules yet — create your first template above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {schedules.map(s => (
            <div key={s.id} className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body font-semibold text-sm text-white/85 truncate">{s.name}</p>
                  <p className="font-body text-[11px] text-white/35 mt-0.5">Due {s.due_offset_days} day{s.due_offset_days === 1 ? "" : "s"} after issuance</p>
                </div>
                {s.is_default && (
                  <span className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-400 font-body text-[10px] font-semibold">
                    <Star className="w-2.5 h-2.5" fill="currentColor" /> Default
                  </span>
                )}
              </div>

              <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.05]">
                {s.line_items.map((li, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0">
                      <p className="font-body text-xs text-white/70 truncate">
                        {INVOICE_LINE_TYPE_LABEL[li.type]}
                        {li.description && <span className="text-white/35"> · {li.description}</span>}
                      </p>
                    </div>
                    <p className={cn(
                      "font-body text-xs font-semibold whitespace-nowrap flex-shrink-0 ml-3",
                      li.amount_cents < 0 ? "text-red-400/80" : "text-white/80",
                    )}>
                      {li.currency} {formatAmount(li.amount_cents)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-white/55 font-body text-xs">
                <span className="text-white/40">Total</span>
                <span className="font-semibold text-white/80">{computeTotal(s.line_items) || "—"}</span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                <button onClick={() => openEdit(s)} disabled={!!draft}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.1] text-white/45 font-body text-xs hover:text-white/70 hover:border-white/20 transition-all disabled:opacity-30">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(s)} disabled={busyId === s.id || !!draft}
                  className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-white/20 font-body text-xs hover:border-red-400/20 hover:text-red-400/60 transition-all disabled:opacity-30">
                  {busyId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {schedules.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/45 font-body text-xs">
          <StickyNote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-pathBlue-400/70" />
          <p>One template can be marked as default. When you issue an invoice for this course, the default template pre-fills the line items — you can still edit before issuing.</p>
        </div>
      )}
    </div>
  );
}
