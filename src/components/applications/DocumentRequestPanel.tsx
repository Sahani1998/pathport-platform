"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Loader2, CalendarDays, XCircle, CheckCircle2, Clock } from "lucide-react";
import { DOCUMENT_TYPES } from "@/types/documents";
import { PRIORITY_META } from "@/types/application-processing";
import type { DocumentRequest, DocumentRequestPriority } from "@/types/application-processing";

interface Props {
  applicationId: string;
  requests:      DocumentRequest[];
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<DocumentRequest["status"], { label: string; color: string; icon: typeof Clock }> = {
  pending:   { label: "Pending",   color: "text-gold-400    bg-gold-400/10    border-gold-400/25",    icon: Clock        },
  fulfilled: { label: "Fulfilled", color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-white/35    bg-white/[0.05]   border-white/[0.10]",   icon: XCircle      },
};

export default function DocumentRequestPanel({ applicationId, requests }: Props) {
  const router = useRouter();
  const [showForm,     setShowForm]     = useState(false);
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [deadline,     setDeadline]     = useState("");
  const [priority,     setPriority]     = useState<DocumentRequestPriority>("normal");
  const [loading,      setLoading]      = useState(false);
  const [cancelling,   setCancelling]   = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/document-requests`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: documentType,
          title:         title.trim(),
          description:   description.trim() || null,
          deadline:      deadline || null,
          priority,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? `Server error (${res.status})`); return; }
      setShowForm(false);
      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("normal");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id: string) => {
    setCancelling(id);
    setError(null);
    try {
      const res = await fetch(`/api/document-requests/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? `Server error (${res.status})`); return; }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FilePlus2 className="w-4 h-4 text-gold-400" />
          <h3 className="font-display text-xl text-white">Document Requests</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="px-3 py-1.5 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/20 transition-all"
        >
          {showForm ? "Close" : "+ New Request"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-white/45 font-body text-xs mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={e => setDocumentType(e.target.value as typeof documentType)}
                className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-xs text-white focus:outline-none focus:border-gold-400/50"
              >
                {DOCUMENT_TYPES.map(d => (
                  <option key={d.value} value={d.value} className="bg-[#0A1228]">{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/45 font-body text-xs mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as DocumentRequestPriority)}
                className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-xs text-white focus:outline-none focus:border-gold-400/50"
              >
                {(Object.keys(PRIORITY_META) as DocumentRequestPriority[]).map(p => (
                  <option key={p} value={p} className="bg-[#0A1228]">{PRIORITY_META[p].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-white/45 font-body text-xs mb-1">Title</label>
            <input
              type="text" required maxLength={255}
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Updated passport bio page"
              className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-xs text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50"
            />
          </div>
          <div>
            <label className="block text-white/45 font-body text-xs mb-1">Description (optional)</label>
            <textarea
              rows={2} maxLength={2000}
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Details visible to the student…"
              className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-xs text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-white/45 font-body text-xs mb-1">Deadline (optional)</label>
            <input
              type="date"
              value={deadline} onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-xs text-white focus:outline-none focus:border-gold-400/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Request"}
          </button>
        </form>
      )}

      {error && <p className="text-red-400 font-body text-xs">{error}</p>}

      {requests.length === 0 ? (
        <p className="text-white/30 font-body text-xs">No document requests yet.</p>
      ) : (
        <div className="space-y-2">
          {requests.map(req => {
            const badge = STATUS_BADGE[req.status];
            const docLabel = DOCUMENT_TYPES.find(d => d.value === req.document_type)?.label ?? req.document_type;
            const BadgeIcon = badge.icon;
            return (
              <div key={req.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-body text-xs font-semibold text-white/80">{req.title}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${PRIORITY_META[req.priority].color}`}>
                      {PRIORITY_META[req.priority].label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${badge.color}`}>
                      <BadgeIcon className="w-2.5 h-2.5" /> {badge.label}
                    </span>
                  </div>
                </div>
                <p className="text-white/40 font-body text-[11px]">{docLabel}{req.description ? ` — ${req.description}` : ""}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {req.deadline && (
                      <span className="inline-flex items-center gap-1 text-white/35 font-body text-[10px]">
                        <CalendarDays className="w-2.5 h-2.5" /> Due {fmtDate(req.deadline)}
                      </span>
                    )}
                    <span className="text-white/25 font-body text-[10px]">Requested {fmtDate(req.created_at)}</span>
                  </div>
                  {req.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => cancel(req.id)}
                      disabled={cancelling === req.id}
                      className="text-white/30 hover:text-red-400 font-body text-[10px] underline underline-offset-2 transition-colors disabled:opacity-50"
                    >
                      {cancelling === req.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
