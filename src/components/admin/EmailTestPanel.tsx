"use client";

import { useState } from "react";
import { Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { EmailTemplate } from "@/lib/email/templates";

const TEMPLATES: { value: EmailTemplate; label: string; audience: "student" | "internal" }[] = [
  { value: "application_submitted",      label: "Application Submitted",         audience: "student"   },
  { value: "documents_requested",        label: "Documents Requested",           audience: "student"   },
  { value: "documents_approved",         label: "Documents Approved",            audience: "student"   },
  { value: "offer_letter_available",     label: "Offer Letter Available",        audience: "student"   },
  { value: "fee_payment_reminder",       label: "Fee Payment Reminder",          audience: "student"   },
  { value: "ipa_processing",             label: "IPA Processing",                audience: "student"   },
  { value: "ipa_approved",               label: "IPA Approved",                  audience: "student"   },
  { value: "arrival_preparation",        label: "Arrival Preparation",           audience: "student"   },
  { value: "application_withdrawn",      label: "Application Withdrawn",         audience: "student"   },
  { value: "withdrawal_notice_internal", label: "Withdrawal Notice (Internal)",  audience: "internal"  },
];

type Result = { success: boolean; logId?: string; error?: string | null; template?: string; to?: string };

const inputCls    = "w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/25 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors [color-scheme:dark]";
const OPTION_STYLE = { backgroundColor: "#0a1024", color: "#fff" } as const;

export default function EmailTestPanel({ isConfigured }: { isConfigured: boolean }) {
  const [to,       setTo]       = useState("");
  const [template, setTemplate] = useState<EmailTemplate>("application_submitted");
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState<Result | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), template }),
      });
      const data = await res.json() as Result;
      setResult(data);
    } catch {
      setResult({ success: false, error: "Network error — could not reach server" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Config status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border font-body text-sm ${
        isConfigured
          ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-400"
          : "bg-amber-500/10  border-amber-400/20  text-amber-400"
      }`}>
        {isConfigured
          ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Resend is configured — emails will be delivered.</>
          : <><XCircle     className="w-4 h-4 flex-shrink-0" /> <span><code className="font-mono text-xs">RESEND_API_KEY</code> not set — emails will be logged but not sent.</span></>
        }
      </div>

      <form onSubmit={handleSend} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">
              Recipient Email *
            </label>
            <input
              type="email"
              required
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">
              Template *
            </label>
            <select
              value={template}
              onChange={e => setTemplate(e.target.value as EmailTemplate)}
              className={inputCls}
            >
              <optgroup label="Student-facing">
                {TEMPLATES.filter(t => t.audience === "student").map(t => (
                  <option key={t.value} value={t.value} style={OPTION_STYLE}>{t.label}</option>
                ))}
              </optgroup>
              <optgroup label="Internal">
                {TEMPLATES.filter(t => t.audience === "internal").map(t => (
                  <option key={t.value} value={t.value} style={OPTION_STYLE}>{t.label}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        <p className="text-white/30 font-body text-xs">
          Sample data (Priya Sharma / Diploma in Business Management / PSB Academy) will be used for all fields.
        </p>

        <button
          type="submit"
          disabled={sending || !to}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            : <><Send    className="w-4 h-4" /> Send Test Email</>
          }
        </button>
      </form>

      {result && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border font-body text-sm ${
          result.success
            ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-400"
            : "bg-red-500/10    border-red-400/20    text-red-400"
        }`}>
          {result.success
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <XCircle      className="w-4 h-4 flex-shrink-0 mt-0.5" />
          }
          <div className="min-w-0">
            {result.success ? (
              <>
                <p className="font-semibold">Email sent successfully</p>
                <p className="text-emerald-400/70 text-xs mt-0.5">
                  Template: <span className="font-mono">{result.template}</span>
                  {result.logId && <> · Log ID: <span className="font-mono">{result.logId}</span></>}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Failed to send</p>
                {result.error && <p className="text-red-400/70 text-xs mt-0.5">{result.error}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
