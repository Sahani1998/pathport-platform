"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle, CheckCircle2, Landmark, Globe2, User2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CollegePaymentSettings, Currency } from "@/types/payment";

const CURRENCIES: Currency[] = ["SGD", "USD", "INR", "GBP", "EUR", "AUD"];

// `[color-scheme:dark]` tells the browser to draw native widgets — the
// <select> dropdown panel, the date-picker calendar, the number-input
// steppers — using the dark system widget set instead of the default light
// one. Without this, the currency dropdown panel is white-on-white on most
// browsers.
const INPUT = cn(
  "w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.10]",
  "font-body text-sm text-white placeholder-white/35",
  "focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/15",
  "transition-colors [color-scheme:dark]",
  "disabled:opacity-100 disabled:text-white/40 disabled:cursor-not-allowed",
);
const LABEL = "block text-white/55 font-body text-[10px] uppercase tracking-wider mb-1.5";
const TEXTAREA = cn(INPUT, "min-h-[80px] resize-y");

// Each <option> needs an explicit dark background as a defense-in-depth — some
// older browsers (especially on Linux/X11) ignore the color-scheme hint for
// option lists. Inline style guarantees both ends of the spectrum.
const OPTION_STYLE = { backgroundColor: "#0a1024", color: "#fff" } as const;

interface Props {
  collegeId:    string;
  collegeName:  string;
  initial:      CollegePaymentSettings | null;
  isAdminView?: boolean;
}

type FormState = {
  bank_transfer_enabled:     boolean;
  bank_name:                 string;
  bank_account_name:         string;
  bank_account_number:       string;
  bank_swift_code:           string;
  bank_branch_code:          string;
  bank_country:              string;
  bank_currency:             string;
  bank_payment_instructions: string;

  wise_enabled:              boolean;
  wise_recipient_name:       string;
  wise_recipient_email:      string;
  wise_currency:             string;
  wise_instructions:         string;

  finance_contact_name:      string;
  finance_email:             string;
  finance_phone:             string;
  finance_whatsapp:          string;
  finance_notes:             string;
};

function init(s: CollegePaymentSettings | null): FormState {
  return {
    bank_transfer_enabled:     s?.bank_transfer_enabled ?? false,
    bank_name:                 s?.bank_name                 ?? "",
    bank_account_name:         s?.bank_account_name         ?? "",
    bank_account_number:       s?.bank_account_number       ?? "",
    bank_swift_code:           s?.bank_swift_code           ?? "",
    bank_branch_code:          s?.bank_branch_code          ?? "",
    bank_country:              s?.bank_country              ?? "",
    bank_currency:             s?.bank_currency             ?? "",
    bank_payment_instructions: s?.bank_payment_instructions ?? "",

    wise_enabled:              s?.wise_enabled              ?? false,
    wise_recipient_name:       s?.wise_recipient_name       ?? "",
    wise_recipient_email:      s?.wise_recipient_email      ?? "",
    wise_currency:             s?.wise_currency             ?? "",
    wise_instructions:         s?.wise_instructions         ?? "",

    finance_contact_name:      s?.finance_contact_name      ?? "",
    finance_email:             s?.finance_email             ?? "",
    finance_phone:             s?.finance_phone             ?? "",
    finance_whatsapp:          s?.finance_whatsapp          ?? "",
    finance_notes:             s?.finance_notes             ?? "",
  };
}

export default function PaymentSettingsForm({ collegeId, collegeName, initial, isAdminView = false }: Props) {
  const router = useRouter();
  const [form,     setForm]     = useState<FormState>(init(initial));
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [savedAt,  setSavedAt]  = useState<Date | null>(initial?.updated_at ? new Date(initial.updated_at) : null);

  const set = <K extends keyof FormState>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const v = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm(f => ({ ...f, [field]: v }));
    };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/colleges/${collegeId}/payment-settings`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json() as { settings?: CollegePaymentSettings; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSavedAt(new Date());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const methodsEnabled = (form.bank_transfer_enabled ? 1 : 0) + (form.wise_enabled ? 1 : 0);

  return (
    <form onSubmit={handleSave} className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {isAdminView && (
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-body text-[11px] font-semibold uppercase tracking-wider">Admin Override</span>
            </div>
          )}
          <h2 className="font-display text-3xl text-white">Payment Settings</h2>
          <p className="text-white/40 font-body text-sm mt-1">
            {collegeName} — students will be shown these details when paying tuition.
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/35 font-body text-xs">
            {methodsEnabled === 0
              ? <span className="text-amber-400">No methods enabled — students cannot pay</span>
              : `${methodsEnabled} method${methodsEnabled === 1 ? "" : "s"} enabled`}
          </p>
          {savedAt && (
            <p className="text-white/50 font-body text-[11px] mt-0.5">
              Last saved {savedAt.toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </div>
      </div>

      {/* ── Bank transfer ─────────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Landmark className="w-4 h-4 text-gold-400" />
            <h3 className="font-display text-lg text-white">Bank Transfer</h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.bank_transfer_enabled}
              onChange={set("bank_transfer_enabled")}
              className="w-4 h-4 accent-gold-400"
            />
            <span className="text-white/70 font-body text-sm">Enable</span>
          </label>
        </header>

        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", !form.bank_transfer_enabled && "opacity-70")}>
          <div>
            <label className={LABEL}>Bank Name *</label>
            <input value={form.bank_name} onChange={set("bank_name")} placeholder="e.g. DBS Bank" className={INPUT}
              disabled={!form.bank_transfer_enabled} />
          </div>
          <div>
            <label className={LABEL}>Account Name *</label>
            <input value={form.bank_account_name} onChange={set("bank_account_name")} placeholder="Beneficiary name" className={INPUT}
              disabled={!form.bank_transfer_enabled} />
          </div>
          <div>
            <label className={LABEL}>Account Number *</label>
            <input value={form.bank_account_number} onChange={set("bank_account_number")} placeholder="0123456789" className={INPUT}
              disabled={!form.bank_transfer_enabled} />
          </div>
          <div>
            <label className={LABEL}>SWIFT / BIC</label>
            <input value={form.bank_swift_code} onChange={set("bank_swift_code")} placeholder="DBSSSGSG" className={INPUT}
              disabled={!form.bank_transfer_enabled} />
          </div>
          <div>
            <label className={LABEL}>Branch Code</label>
            <input value={form.bank_branch_code} onChange={set("bank_branch_code")} placeholder="001" className={INPUT}
              disabled={!form.bank_transfer_enabled} />
          </div>
          <div>
            <label className={LABEL}>Bank Country</label>
            <input value={form.bank_country} onChange={set("bank_country")} placeholder="Singapore" className={INPUT}
              disabled={!form.bank_transfer_enabled} />
          </div>
          <div>
            <label className={LABEL}>Currency</label>
            <select value={form.bank_currency} onChange={set("bank_currency")} className={INPUT}
              disabled={!form.bank_transfer_enabled}>
              <option value=""  style={OPTION_STYLE}>Select…</option>
              {CURRENCIES.map(c => <option key={c} value={c} style={OPTION_STYLE}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Payment Instructions for Students</label>
            <textarea value={form.bank_payment_instructions} onChange={set("bank_payment_instructions")}
              placeholder="e.g. Please include your student ID in the transfer reference."
              className={TEXTAREA} disabled={!form.bank_transfer_enabled} />
          </div>
        </div>
      </section>

      {/* ── Wise ──────────────────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe2 className="w-4 h-4 text-gold-400" />
            <h3 className="font-display text-lg text-white">Wise (International)</h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.wise_enabled}
              onChange={set("wise_enabled")}
              className="w-4 h-4 accent-gold-400"
            />
            <span className="text-white/70 font-body text-sm">Enable</span>
          </label>
        </header>

        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", !form.wise_enabled && "opacity-70")}>
          <div>
            <label className={LABEL}>Recipient Name *</label>
            <input value={form.wise_recipient_name} onChange={set("wise_recipient_name")} placeholder="College name as registered on Wise"
              className={INPUT} disabled={!form.wise_enabled} />
          </div>
          <div>
            <label className={LABEL}>Recipient Email *</label>
            <input type="email" value={form.wise_recipient_email} onChange={set("wise_recipient_email")} placeholder="finance@college.edu.sg"
              className={INPUT} disabled={!form.wise_enabled} />
          </div>
          <div>
            <label className={LABEL}>Currency</label>
            <select value={form.wise_currency} onChange={set("wise_currency")} className={INPUT}
              disabled={!form.wise_enabled}>
              <option value=""  style={OPTION_STYLE}>Select…</option>
              {CURRENCIES.map(c => <option key={c} value={c} style={OPTION_STYLE}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Wise Instructions for Students</label>
            <textarea value={form.wise_instructions} onChange={set("wise_instructions")}
              placeholder="e.g. Send via Wise to the recipient email above and upload the proof here."
              className={TEXTAREA} disabled={!form.wise_enabled} />
          </div>
        </div>
      </section>

      {/* ── Finance contact ───────────────────────────────────────────────────── */}
      <section className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-4">
        <header className="flex items-center gap-2.5">
          <User2 className="w-4 h-4 text-gold-400" />
          <h3 className="font-display text-lg text-white">Finance Contact</h3>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Contact Name</label>
            <input value={form.finance_contact_name} onChange={set("finance_contact_name")} placeholder="Finance officer" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Email</label>
            <input type="email" value={form.finance_email} onChange={set("finance_email")} placeholder="finance@college.edu.sg" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Phone</label>
            <input value={form.finance_phone} onChange={set("finance_phone")} placeholder="+65 1234 5678" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>WhatsApp</label>
            <input value={form.finance_whatsapp} onChange={set("finance_whatsapp")} placeholder="+65 1234 5678" className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Internal Notes</label>
            <textarea value={form.finance_notes} onChange={set("finance_notes")}
              placeholder="Notes visible to your team and PathPort admin (not shown to students)."
              className={TEXTAREA} />
          </div>
        </div>
      </section>

      {/* ── Error + actions ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {!error && savedAt && !saving && (
          <span className="flex items-center gap-1.5 text-emerald-400/80 font-body text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Settings saved
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl",
            "bg-gold-400/15 border border-gold-400/30 text-gold-400",
            "font-body text-sm font-semibold",
            "hover:bg-gold-400/25 transition-all disabled:opacity-50",
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Payment Settings"}
        </button>
      </div>
    </form>
  );
}
