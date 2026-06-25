// Server component — counts are fetched with the admin client (service role)
// so RLS never blocks them and they render inline with the page, no spinners.

import Link from "next/link";
import {
  AlertCircle,
  Globe,
  GraduationCap,
  LayoutGrid,
  BookOpen,
  CalendarRange,
  Settings as SettingsIcon,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin-client";
import RefreshButton from "./RefreshButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type CountResult =
  | { kind: "ok";    count: number }
  | { kind: "error"; message: string };

interface CardSpec {
  key:         string;
  title:       string;
  description: string;
  icon:        React.ElementType;
  href:        string;
  tableLabel:  string;
  result:      CountResult;
}

// ─── Server-side count fetch ──────────────────────────────────────────────────

async function getCount(table: string, sectionKey?: string): Promise<CountResult> {
  try {
    const db = createAdminClient();
    const q = sectionKey
      ? db.from(table).select("id", { count: "exact", head: true }).eq("section_key", sectionKey)
      : db.from(table).select("id", { count: "exact", head: true });

    const { count, error } = await q;

    if (error) {
      return { kind: "error", message: `${error.code ?? "ERR"}: ${error.message}` };
    }
    return { kind: "ok", count: count ?? 0 };
  } catch (err) {
    return { kind: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicContentOverviewPage() {
  // All six counts fetched in parallel on the server — no client-side loading.
  const [
    destinations,
    qualLevels,
    pathwayCards,
    durationGuide,
    intakes,
    siteSettings,
  ] = await Promise.all([
    getCount("public_destinations"),
    getCount("public_qualification_levels"),
    getCount("public_pathway_cards"),
    getCount("public_page_sections"),
    getCount("public_page_sections", "intake_options"),
    getCount("site_settings"),
  ]);

  const CARDS: CardSpec[] = [
    {
      key:         "public_destinations",
      title:       "Destinations",
      description: "Countries shown on the homepage DestinationPathway section. Control live/coming soon/hidden status per destination.",
      icon:        Globe,
      href:        "/dashboard/admin/public-content/destinations",
      tableLabel:  "public_destinations",
      result:      destinations,
    },
    {
      key:         "public_qualification_levels",
      title:       "Qualification Levels",
      description: "Diploma progression pathway cards shown on /colleges. Control labels, durations, body copy, and highlighted state.",
      icon:        GraduationCap,
      href:        "/dashboard/admin/public-content/qualification-levels",
      tableLabel:  "public_qualification_levels",
      result:      qualLevels,
    },
    {
      key:         "public_pathway_cards",
      title:       "Pathway Cards",
      description: "DiplomaTypesExplained cards on /courses. Edit icons, badges, subject lists, and progression copy.",
      icon:        BookOpen,
      href:        "/dashboard/admin/public-content/pathway-cards",
      tableLabel:  "public_pathway_cards",
      result:      pathwayCards,
    },
    {
      key:         "public_page_sections",
      title:       "Duration Guide",
      description: "Study duration table rows for the DurationGuide section. Edit full-time, part-time, and internship fields per level.",
      icon:        LayoutGrid,
      href:        "/dashboard/admin/public-content/duration-guide",
      tableLabel:  "public_page_sections",
      result:      durationGuide,
    },
    {
      key:         "intake_options",
      title:       "Intake Options",
      description: "Intake dates shown in the student interest form. Add or retire intakes with no deploy. Past intakes should be archived.",
      icon:        CalendarRange,
      href:        "/dashboard/admin/public-content/intakes",
      tableLabel:  "public_page_sections (section_key=intake_options)",
      result:      intakes,
    },
    {
      key:         "site_settings",
      title:       "Site Settings",
      description: "Global contact details: WhatsApp number, support email, social links. Read by footer, JSON-LD, interest form, and the floating advisor widget.",
      icon:        SettingsIcon,
      href:        "/dashboard/admin/public-content/site-settings",
      tableLabel:  "site_settings",
      result:      siteSettings,
    },
  ];

  const missingTables = CARDS
    .filter(c => c.result.kind === "error" && c.result.message.includes("42P01"))
    .map(c => c.tableLabel);

  const errors = CARDS.filter(
    c => c.result.kind === "error" && !c.result.message.includes("42P01")
  );

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
        <RefreshButton />
      </div>

      {/* ── Missing-table banner ─────────────────────────────────────── */}
      {missingTables.length > 0 && (
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

      {/* ── Unexpected-error banner ──────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-red-500/[0.07] border border-red-500/25">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-white/75 font-body text-sm font-semibold">Some counts could not be fetched</p>
            {errors.map(c => (
              <p key={c.key} className="text-white/50 font-body text-xs">
                <span className="text-white/70">{c.title}:</span>{" "}
                {(c.result as { kind: "error"; message: string }).message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── Content cards grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
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

                <CountPill result={card.result} />
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

// ─── Count pill ───────────────────────────────────────────────────────────────

function CountPill({ result }: { result: CountResult }) {
  if (result.kind === "ok") {
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/55 border border-white/[0.08] font-body text-xs font-semibold whitespace-nowrap">
        {result.count} row{result.count === 1 ? "" : "s"}
      </span>
    );
  }

  if (result.message.includes("42P01")) {
    return (
      <span
        className="px-2.5 py-0.5 rounded-full bg-gold-400/15 text-gold-400 border border-gold-400/30 font-body text-xs font-semibold whitespace-nowrap"
        title="Table not found — run migration"
      >
        Missing table
      </span>
    );
  }

  return (
    <span
      className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-body text-xs font-semibold whitespace-nowrap"
      title={result.message}
    >
      Error
    </span>
  );
}
