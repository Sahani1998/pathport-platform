"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, Loader2, Save, RefreshCw } from "lucide-react";

interface SettingRow {
  key: string;
  value: string;
  label: string;
  group_name: string;
  is_public: boolean;
  updated_at: string;
}

const GROUP_TITLES: Record<string, { title: string; description: string }> = {
  contact: {
    title: "Contact details",
    description: "Used in the footer, WhatsApp widget, JSON-LD organisation block, and inside the interest form. Editing here updates every public page.",
  },
  social: {
    title: "Social links",
    description: "Full URLs (with https://). Blank entries are hidden from the schema.org sameAs array.",
  },
  general: {
    title: "General",
    description: "Other site-wide settings.",
  },
};

const GROUP_ORDER = ["contact", "social", "general"];

export default function SiteSettingsPage() {
  const [rows,    setRows]    = useState<SettingRow[]>([]);
  const [drafts,  setDrafts]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey,  setSavedKey]  = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("site_settings")
        .select("*")
        .order("group_name", { ascending: true })
        .order("key",        { ascending: true });

      if (fetchError) {
        if (fetchError.code === "42P01") {
          setError("Table not found. Run migration sprint31b_settings_and_intakes.sql in Supabase SQL Editor.");
        } else {
          setError(`Query failed: ${fetchError.message} (${fetchError.code})`);
        }
      } else {
        const fetched = (data ?? []) as SettingRow[];
        setRows(fetched);
        const draftMap: Record<string, string> = {};
        for (const r of fetched) draftMap[r.key] = r.value;
        setDrafts(draftMap);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Unexpected error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleSave = async (key: string) => {
    setSavingKey(key);
    setSavedKey(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("site_settings")
        .update({ value: drafts[key] ?? "" })
        .eq("key", key);

      if (updateError) {
        console.error("[SiteSettings] update error:", updateError.message);
      } else {
        setSavedKey(key);
        await fetchRows();
        setTimeout(() => setSavedKey(prev => prev === key ? null : prev), 2000);
      }
    } finally {
      setSavingKey(null);
    }
  };

  const inputCls = "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-all";
  const btnPrimary = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-500/20 border border-gold-400/40 text-gold-300 font-body text-xs font-semibold hover:bg-gold-500/30 transition-all disabled:opacity-50";

  // Group rows for rendering
  const groups: Record<string, SettingRow[]> = {};
  for (const r of rows) {
    if (!groups[r.group_name]) groups[r.group_name] = [];
    groups[r.group_name].push(r);
  }
  const orderedGroups = [
    ...GROUP_ORDER.filter(g => groups[g]),
    ...Object.keys(groups).filter(g => !GROUP_ORDER.includes(g)),
  ];

  return (
    <div className="space-y-6 max-w-7xl">

      <Link
        href="/dashboard/admin/public-content"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-sm transition-colors"
      >
        ← Public Content
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">Site Settings</h2>
          <p className="text-white/45 font-body text-sm">
            {rows.length} keys · table = site_settings · global contact &amp; social config
          </p>
        </div>
        <button
          onClick={fetchRows}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 hover:text-white/80 hover:border-white/20 font-body text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white/75 font-body text-sm font-semibold mb-1">Table not set up</p>
            <p className="text-white/50 font-body text-sm">{error}</p>
            <p className="text-white/40 font-body text-xs mt-2">
              File: <code className="text-gold-300">src/lib/supabase/sprint31b_settings_and_intakes.sql</code>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-white/35">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-body text-sm">Loading settings…</span>
        </div>
      ) : (
        <div className="space-y-5">
          {orderedGroups.map(groupName => {
            const meta = GROUP_TITLES[groupName] ?? { title: groupName, description: "" };
            return (
              <div key={groupName} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <p className="font-display text-lg text-white/90">{meta.title}</p>
                  {meta.description && <p className="font-body text-xs text-white/45 mt-1">{meta.description}</p>}
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {groups[groupName].map(row => {
                    const dirty = (drafts[row.key] ?? "") !== row.value;
                    return (
                      <div key={row.key} className="px-5 py-4 grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-start">
                        <div className="min-w-0">
                          <p className="font-body text-sm text-white/85 leading-snug">{row.label}</p>
                          <p className="font-mono text-[10px] text-white/30 mt-0.5">
                            {row.key} · {row.is_public ? "public" : "admin-only"}
                          </p>
                        </div>
                        <input
                          type="text"
                          value={drafts[row.key] ?? ""}
                          onChange={e => setDrafts(d => ({ ...d, [row.key]: e.target.value }))}
                          className={inputCls}
                          placeholder={row.value || "—"}
                        />
                        <button
                          onClick={() => handleSave(row.key)}
                          disabled={!dirty || savingKey === row.key}
                          className={btnPrimary}
                        >
                          {savingKey === row.key
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving</>
                            : savedKey === row.key
                              ? <>✓ Saved</>
                              : <><Save className="w-3.5 h-3.5" /> Save</>
                          }
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-white/35 font-body text-xs">
        Changes propagate on the next page render. Server-rendered pages (footer, homepage JSON-LD) use React cache() — they will reflect new values on the next request. Client widgets (WhatsApp button, interest form) re-fetch on mount.
      </p>
    </div>
  );
}
