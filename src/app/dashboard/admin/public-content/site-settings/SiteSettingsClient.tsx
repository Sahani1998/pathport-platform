"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, Loader2, Save, RefreshCw, Database, ShieldX, ServerCrash } from "lucide-react";

export interface SettingRow {
  key: string;
  value: string;
  label: string;
  group_name: string;
  is_public: boolean;
  updated_at: string;
}

type ErrorKind = "missing_table" | "permission_denied" | "empty_rows" | "timeout" | "unknown";

interface FetchError {
  kind: ErrorKind;
  message: string;
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

const ERROR_META: Record<ErrorKind, { title: string; icon: React.ElementType; guidance: React.ReactNode }> = {
  missing_table: {
    title: "Table not set up — migration required",
    icon: Database,
    guidance: (
      <>
        <p className="text-white/50 font-body text-sm">The <code className="text-gold-300">site_settings</code> table does not exist in your Supabase project.</p>
        <p className="text-white/40 font-body text-xs mt-2">
          Run <code className="text-gold-300">src/lib/supabase/sprint31b_settings_and_intakes.sql</code> in the Supabase SQL Editor. It creates the table, enables RLS, and seeds the 8 default rows.
        </p>
      </>
    ),
  },
  permission_denied: {
    title: "Admin permission denied — RLS issue",
    icon: ShieldX,
    guidance: (
      <>
        <p className="text-white/50 font-body text-sm">Your account does not have the <code className="text-gold-300">admin</code> role in <code className="text-gold-300">profiles</code>, or the RLS policy is missing.</p>
        <p className="text-white/40 font-body text-xs mt-2">
          Check: <code className="text-gold-300">SELECT role FROM profiles WHERE id = auth.uid();</code> — it must return <code className="text-gold-300">admin</code>.
          If the policy is missing, re-run the migration SQL.
        </p>
      </>
    ),
  },
  empty_rows: {
    title: "Table exists but has no settings rows",
    icon: Database,
    guidance: (
      <>
        <p className="text-white/50 font-body text-sm">The <code className="text-gold-300">site_settings</code> table exists but contains no rows.</p>
        <p className="text-white/40 font-body text-xs mt-2">
          Re-run the seed section of <code className="text-gold-300">sprint31b_settings_and_intakes.sql</code> (the <code className="text-gold-300">INSERT INTO site_settings</code> block) — all inserts are <code className="text-gold-300">ON CONFLICT DO NOTHING</code> so it is safe to re-run.
        </p>
      </>
    ),
  },
  timeout: {
    title: "Request timed out — Supabase unreachable",
    icon: ServerCrash,
    guidance: (
      <>
        <p className="text-white/50 font-body text-sm">The query to <code className="text-gold-300">site_settings</code> did not respond within 15 seconds.</p>
        <p className="text-white/40 font-body text-xs mt-2">
          Check your Supabase project URL and anon key in <code className="text-gold-300">.env.local</code>. Make sure the project is not paused.
        </p>
      </>
    ),
  },
  unknown: {
    title: "Unexpected error",
    icon: AlertCircle,
    guidance: null,
  },
};

function classifyError(code: string | undefined, message: string): ErrorKind {
  if (code === "42P01") return "missing_table";
  if (code === "42501" || code === "PGRST301" || message.toLowerCase().includes("permission denied")) return "permission_denied";
  return "unknown";
}

export default function SiteSettingsClient({ initialRows }: { initialRows: SettingRow[] }) {
  const [rows,      setRows]      = useState<SettingRow[]>(initialRows);
  const [drafts,    setDrafts]    = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const r of initialRows) m[r.key] = r.value;
    return m;
  });
  const [loading,   setLoading]   = useState(false);
  const [fetchErr,  setFetchErr]  = useState<FetchError | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey,  setSavedKey]  = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15_000);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("site_settings")
        .select("*")
        .order("group_name", { ascending: true })
        .order("key",        { ascending: true })
        .abortSignal(controller.signal);

      if (fetchError) {
        const kind = classifyError(fetchError.code, fetchError.message);
        setFetchErr({ kind, message: `${fetchError.message} (${fetchError.code})` });
        setRows([]);
        setDrafts({});
      } else {
        const fetched = (data ?? []) as SettingRow[];
        if (fetched.length === 0) {
          setFetchErr({ kind: "empty_rows", message: "Query succeeded but returned 0 rows." });
        }
        setRows(fetched);
        const draftMap: Record<string, string> = {};
        for (const r of fetched) draftMap[r.key] = r.value;
        setDrafts(draftMap);
      }
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort) {
        setFetchErr({ kind: "timeout", message: "Request aborted after 15 s." });
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setFetchErr({ kind: "unknown", message: msg });
      }
      setRows([]);
      setDrafts({});
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

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

  const inputCls  = "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-all";
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

  const errMeta = fetchErr ? ERROR_META[fetchErr.kind] : null;
  const ErrIcon = errMeta?.icon ?? AlertCircle;

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
            {loading
              ? "Refreshing… · table = site_settings"
              : fetchErr
                ? `Error · table = site_settings`
                : `${rows.length} key${rows.length !== 1 ? "s" : ""} · table = site_settings · global contact & social config`
            }
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

      {/* ── State: loading ─────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-white/35">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-body text-sm">Refreshing settings…</span>
        </div>
      )}

      {/* ── State: error ───────────────────────────────────────────── */}
      {!loading && fetchErr && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <ErrIcon className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-white/75 font-body text-sm font-semibold">{errMeta?.title}</p>
            {errMeta?.guidance}
            <p className="text-white/25 font-mono text-[10px] pt-1">{fetchErr.message}</p>
          </div>
        </div>
      )}

      {/* ── State: loaded (rows present) ───────────────────────────── */}
      {!loading && !fetchErr && rows.length > 0 && (
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
