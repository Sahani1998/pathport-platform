"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  AlertCircle,
  Globe,
  GraduationCap,
  LayoutGrid,
  BookOpen,
  Loader2,
  CalendarRange,
  Settings as SettingsIcon,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CardState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; count: number }
  | { kind: "missing_table"; message: string }
  | { kind: "timeout" }
  | { kind: "error"; code: string | null; message: string };

type CountTask =
  | { key: string; kind: "table";   table: string }
  | { key: string; kind: "section"; sectionKey: string };

interface CardSpec {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  tableLabel: string;
  task: CountTask;
}

// ─── Card specs (single source of truth) ──────────────────────────────────────

const CARDS: CardSpec[] = [
  {
    key:         "public_destinations",
    title:       "Destinations",
    description: "Countries shown on the homepage DestinationPathway section. Control live/coming soon/hidden status per destination.",
    icon:        Globe,
    href:        "/dashboard/admin/public-content/destinations",
    tableLabel:  "public_destinations",
    task:        { key: "public_destinations", kind: "table", table: "public_destinations" },
  },
  {
    key:         "public_qualification_levels",
    title:       "Qualification Levels",
    description: "Diploma progression pathway cards shown on /colleges. Control labels, durations, body copy, and highlighted state.",
    icon:        GraduationCap,
    href:        "/dashboard/admin/public-content/qualification-levels",
    tableLabel:  "public_qualification_levels",
    task:        { key: "public_qualification_levels", kind: "table", table: "public_qualification_levels" },
  },
  {
    key:         "public_pathway_cards",
    title:       "Pathway Cards",
    description: "DiplomaTypesExplained cards on /courses. Edit icons, badges, subject lists, and progression copy.",
    icon:        BookOpen,
    href:        "/dashboard/admin/public-content/pathway-cards",
    tableLabel:  "public_pathway_cards",
    task:        { key: "public_pathway_cards", kind: "table", table: "public_pathway_cards" },
  },
  {
    key:         "public_page_sections",
    title:       "Duration Guide",
    description: "Study duration table rows for the DurationGuide section. Edit full-time, part-time, and internship fields per level.",
    icon:        LayoutGrid,
    href:        "/dashboard/admin/public-content/duration-guide",
    tableLabel:  "public_page_sections",
    task:        { key: "public_page_sections", kind: "table", table: "public_page_sections" },
  },
  {
    key:         "intake_options",
    title:       "Intake Options",
    description: "Intake dates shown in the student interest form. Add or retire intakes with no deploy. Past intakes should be archived.",
    icon:        CalendarRange,
    href:        "/dashboard/admin/public-content/intakes",
    tableLabel:  "public_page_sections (section_key=intake_options)",
    task:        { key: "intake_options", kind: "section", sectionKey: "intake_options" },
  },
  {
    key:         "site_settings",
    title:       "Site Settings",
    description: "Global contact details: WhatsApp number, support email, social links. Read by footer, JSON-LD, interest form, and the floating advisor widget.",
    icon:        SettingsIcon,
    href:        "/dashboard/admin/public-content/site-settings",
    tableLabel:  "site_settings",
    task:        { key: "site_settings", kind: "table", table: "site_settings" },
  },
];

// ─── Per-card count fetch with 10 s timeout ───────────────────────────────────

async function fetchCount(task: CountTask): Promise<CardState> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 10_000);

  try {
    const supabase = createClient();
    const query = task.kind === "table"
      ? supabase.from(task.table).select("id", { count: "exact", head: true })
      : supabase.from("public_page_sections").select("id", { count: "exact", head: true }).eq("section_key", task.sectionKey);

    const { count, error } = await query.abortSignal(controller.signal);

    if (error) {
      if (error.code === "42P01") {
        return { kind: "missing_table", message: error.message };
      }
      console.warn(`[PublicContent] ${task.key} query error:`, error.code, error.message);
      return { kind: "error", code: error.code ?? null, message: error.message };
    }
    return { kind: "ok", count: count ?? 0 };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[PublicContent] ${task.key} timed out after 10 s`);
      return { kind: "timeout" };
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[PublicContent] ${task.key} unexpected:`, msg);
    return { kind: "error", code: null, message: msg };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublicContentOverviewPage() {
  const [states, setStates] = useState<Record<string, CardState>>(
    () => Object.fromEntries(CARDS.map(c => [c.key, { kind: "idle" } as CardState]))
  );

  // Each fetchAll bumps reqIdRef. State updates from a stale request are dropped,
  // so overlapping invocations (e.g. StrictMode double-mount, Refresh while
  // initial load is in flight) can never leave cards stuck on "loading".
  const reqIdRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const fetchAll = useCallback(async () => {
    const myReqId = ++reqIdRef.current;

    setStates(prev => {
      const next: Record<string, CardState> = { ...prev };
      for (const c of CARDS) next[c.key] = { kind: "loading" };
      return next;
    });

    // fetchCount() always resolves with a CardState — it never throws — but
    // allSettled is the safer contract: a thrown rejection cannot wedge the
    // entire batch.
    const results = await Promise.allSettled(
      CARDS.map(async (c) => ({ key: c.key, state: await fetchCount(c.task) }))
    );

    // Drop results if a newer fetch has started, or component unmounted.
    if (!mountedRef.current || myReqId !== reqIdRef.current) return;

    setStates(prev => {
      const next: Record<string, CardState> = { ...prev };
      for (const r of results) {
        if (r.status === "fulfilled") {
          next[r.value.key] = r.value.state;
        } else {
          // Defensive: should be unreachable since fetchCount catches.
          console.warn("[PublicContent] settle rejected:", r.reason);
          // Don't leave the card stuck on loading — flip it to error.
        }
      }
      // Belt-and-braces: any card still in "loading" at this point is a bug;
      // flip it to error so the spinner never hangs indefinitely.
      for (const c of CARDS) {
        if (next[c.key]?.kind === "loading") {
          console.warn(`[PublicContent] ${c.key} settled with no state — forcing error.`);
          next[c.key] = { kind: "error", code: null, message: "No state returned" };
        }
      }
      return next;
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const anyLoading       = Object.values(states).some(s => s.kind === "loading");
  const missingTables    = CARDS.filter(c => states[c.key]?.kind === "missing_table").map(c => c.tableLabel);
  const hasMissingTables = missingTables.length > 0;

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">Public Content</h2>
          <p className="text-white/45 font-body text-sm">
            Manage admin-editable content shown on the public site
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={anyLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 hover:text-white/80 hover:border-white/20 font-body text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", anyLoading && "animate-spin")} />
          {anyLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Migration banner: only for genuinely missing tables ─────── */}
      {hasMissingTables && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-white/75 font-body text-sm font-semibold">Migration not yet applied</p>
            <p className="text-white/50 font-body text-sm">
              The following table{missingTables.length === 1 ? " is" : "s are"} missing:{" "}
              {missingTables.map(t => <code key={t} className="text-gold-300 mr-1.5">{t}</code>)}
            </p>
            <p className="text-white/40 font-body text-xs">
              Run{" "}
              <code className="text-gold-300">src/lib/supabase/sprint31_public_content.sql</code>
              {" "}and{" "}
              <code className="text-gold-300">sprint31b_settings_and_intakes.sql</code>
              {" "}in the Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* ── Content cards grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map((card) => {
          const Icon  = card.icon;
          const state = states[card.key] ?? { kind: "idle" };
          return (
            <div
              key={card.key}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white/50" />
                  </div>
                  <h3 className="font-display text-lg text-white/90">{card.title}</h3>
                </div>

                <CountPill state={state} />
              </div>

              <p className="font-body text-sm text-white/45 leading-relaxed flex-1">
                {card.description}
              </p>

              <p className="font-mono text-[10px] text-white/25">{card.tableLabel}</p>

              <Link
                href={card.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 hover:text-white/80 hover:border-white/20 font-body text-sm transition-all self-start"
              >
                Manage →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Count pill — pure state→pixel mapping ────────────────────────────────────

function CountPill({ state }: { state: CardState }) {
  switch (state.kind) {
    case "idle":
    case "loading":
      return (
        <div className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
          <Loader2 className="w-3 h-3 text-white/30 animate-spin" />
        </div>
      );
    case "ok":
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/55 border border-white/[0.08] font-body text-xs font-semibold whitespace-nowrap">
          {state.count} row{state.count === 1 ? "" : "s"}
        </span>
      );
    case "missing_table":
      return (
        <span
          className="px-2.5 py-0.5 rounded-full bg-gold-400/15 text-gold-400 border border-gold-400/30 font-body text-xs font-semibold whitespace-nowrap"
          title="Table not found — run migration"
        >
          Check table
        </span>
      );
    case "timeout":
      return (
        <span
          className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/45 border border-white/[0.12] font-body text-xs font-semibold whitespace-nowrap"
          title="Query timed out after 10 s — Supabase unreachable"
        >
          Timeout
        </span>
      );
    case "error":
      return (
        <span
          className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/45 border border-white/[0.12] font-body text-xs font-semibold whitespace-nowrap"
          title={`${state.code ?? "ERR"} — ${state.message}`}
        >
          Unavailable
        </span>
      );
  }
}
