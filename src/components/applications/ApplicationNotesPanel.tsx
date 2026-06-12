"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Loader2, ShieldCheck } from "lucide-react";
import type { ApplicationNoteWithAuthor } from "@/types/application-processing";

interface Props {
  applicationId: string;
  notes:         ApplicationNoteWithAuthor[];
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("en-SG", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ApplicationNotesPanel({ applicationId, notes }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/notes`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: content.trim() }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? `Server error (${res.status})`); return; }
      setContent("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-pathBlue-400" />
          <h3 className="font-display text-xl text-white">Internal Notes</h3>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.10] text-white/35 font-body text-[10px]">
          <ShieldCheck className="w-2.5 h-2.5" /> Not visible to student
        </span>
      </div>

      <form onSubmit={submit} className="space-y-2">
        <textarea
          rows={2} maxLength={4000} required
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Add an internal note for your team…"
          className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-xs text-white placeholder-white/25 focus:outline-none focus:border-pathBlue-400/50 resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          {error ? <p className="text-red-400 font-body text-xs">{error}</p> : <span />}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-4 py-2 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/30 text-pathBlue-400 font-body text-xs font-semibold hover:bg-pathBlue-500/25 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add Note"}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-white/30 font-body text-xs">No internal notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <p className="text-white/70 font-body text-xs whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-white/30 font-body text-[10px]">
                  {note.author_name ?? "Unknown"} · {note.author_role === "admin" ? "Admin" : "Institution"} · {fmtDateTime(note.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
