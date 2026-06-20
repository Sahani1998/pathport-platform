"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, Globe, GraduationCap, LayoutGrid, BookOpen, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  table: string;
  count: number | null;
  error: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublicContentOverviewPage() {
  const [counts, setCounts] = useState<Record<string, number | null>>({
    public_destinations: null,
    public_qualification_levels: null,
    public_pathway_cards: null,
    public_page_sections: null,
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [anyError, setAnyError] = useState(false);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setAnyError(false);

    const supabase = createClient();

    const tables = [
      "public_destinations",
      "public_qualification_levels",
      "public_pathway_cards",
      "public_page_sections",
    ] as const;

    const results = await Promise.all(
      tables.map(async (table) => {
        try {
          const { count, error } = await supabase
            .from(table)
            .select("id", { count: "exact", head: true });

          console.log(
            `[PublicContent] ${table} — count:`, count,
            "| error:", error?.code ?? "none"
          );

          if (error) {
            return { table, count: null, error: true };
          }
          return { table, count: count ?? 0, error: false };
        } catch (err) {
          console.error(`[PublicContent] ${table} exception:`, err);
          return { table, count: null, error: true };
        }
      })
    );

    const newCounts: Record<string, number | null> = {};
    const newErrors: Record<string, boolean> = {};
    let hasError = false;

    for (const r of results) {
      newCounts[r.table] = r.count;
      newErrors[r.table] = r.error;
      if (r.error) hasError = true;
    }

    setCounts(newCounts);
    setErrors(newErrors);
    setAnyError(hasError);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const cards: ContentCard[] = [
    {
      title: "Destinations",
      description: "Countries shown on the homepage DestinationPathway section. Control live/coming soon/hidden status per destination.",
      icon: Globe,
      href: "/dashboard/admin/public-content/destinations",
      table: "public_destinations",
      count: counts.public_destinations,
      error: errors.public_destinations ?? false,
    },
    {
      title: "Qualification Levels",
      description: "Diploma progression pathway cards shown on /colleges. Control labels, durations, body copy, and highlighted state.",
      icon: GraduationCap,
      href: "/dashboard/admin/public-content/qualification-levels",
      table: "public_qualification_levels",
      count: counts.public_qualification_levels,
      error: errors.public_qualification_levels ?? false,
    },
    {
      title: "Pathway Cards",
      description: "DiplomaTypesExplained cards on /courses. Edit icons, badges, subject lists, and progression copy.",
      icon: BookOpen,
      href: "/dashboard/admin/public-content/pathway-cards",
      table: "public_pathway_cards",
      count: counts.public_pathway_cards,
      error: errors.public_pathway_cards ?? false,
    },
    {
      title: "Duration Guide",
      description: "Study duration table rows for the DurationGuide section. Edit full-time, part-time, and internship fields per level.",
      icon: LayoutGrid,
      href: "/dashboard/admin/public-content/duration-guide",
      table: "public_page_sections",
      count: counts.public_page_sections,
      error: errors.public_page_sections ?? false,
    },
  ];

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
          onClick={fetchCounts}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 hover:text-white/80 hover:border-white/20 font-body text-sm transition-all disabled:opacity-50"
        >
          <Loader2 className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── Error banner ────────────────────────────────────────────── */}
      {anyError && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white/75 font-body text-sm font-semibold mb-1">Migration not yet applied</p>
            <p className="text-white/50 font-body text-sm">
              One or more public content tables are missing. Run the migration in Supabase SQL Editor.
            </p>
            <p className="text-white/40 font-body text-xs mt-2">
              File:{" "}
              <code className="text-gold-300">src/lib/supabase/sprint31_public_content.sql</code>
            </p>
          </div>
        </div>
      )}

      {/* ── Content cards grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.table}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white/50" />
                  </div>
                  <h3 className="font-display text-lg text-white/90">{card.title}</h3>
                </div>

                {/* Count pill */}
                {loading ? (
                  <div className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
                    <Loader2 className="w-3 h-3 text-white/30 animate-spin" />
                  </div>
                ) : card.error ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-400/15 text-gold-400 border border-gold-400/30 font-body text-xs font-semibold">
                    —
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/55 border border-white/[0.08] font-body text-xs font-semibold">
                    {card.count ?? 0} rows
                  </span>
                )}
              </div>

              <p className="font-body text-sm text-white/45 leading-relaxed flex-1">
                {card.description}
              </p>

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
