import { Clock, AlertCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin-client";

interface DurationRow {
  level_label: string;
  full_time: string;
  part_time: string;
  internship: string;
}

export default async function DurationGuide() {
  const adminDb = createAdminClient();
  const { data } = await adminDb
    .from("public_page_sections")
    .select("data, display_order")
    .eq("section_key", "duration_guide")
    .eq("status", "published")
    .order("display_order");

  const rows = (data ?? []).map(r => r.data as DurationRow);

  if (rows.length === 0) return null;
  return (
    <section className="relative cream-band">
      <div className="layout-shell section-airy">

        <div className="text-center mb-10">
          <p className="inline-flex items-center gap-3 eyebrow text-gold-700 mb-4">
            <span className="w-8 h-px bg-gold-700/50 rounded-full" />
            Duration Guide
            <span className="w-8 h-px bg-gold-700/50 rounded-full" />
          </p>
          <h2 className="display-3 text-navy-900 mb-4 max-w-2xl mx-auto">
            How long programmes actually take.
          </h2>
          <p className="prose-lg text-navy-800/70 max-w-2xl mx-auto">
            These ranges are typical across Singapore&rsquo;s private college sector. Your specific programme may be shorter or longer depending on intake schedule, internship structure, and the college.
          </p>
        </div>

        {/* Duration table — warm panel for visual rest */}
        <div className="warm-panel-card rounded-3xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-4 gap-0 bg-gold-100/40 border-b border-gold-500/20">
              <div className="p-4 font-body text-navy-900 text-xs font-semibold uppercase tracking-wider">Level</div>
              <div className="p-4 font-body text-navy-900 text-xs font-semibold uppercase tracking-wider">Full-time</div>
              <div className="p-4 font-body text-navy-900 text-xs font-semibold uppercase tracking-wider">Part-time</div>
              <div className="p-4 font-body text-navy-900 text-xs font-semibold uppercase tracking-wider">Internship</div>
            </div>
            {rows.map((row, i) => (
              <div
                key={row.level_label}
                className={`grid grid-cols-4 gap-0 ${i < rows.length - 1 ? "border-b border-gold-500/15" : ""}`}
              >
                <div className="p-4 font-body font-semibold text-navy-900 text-sm">{row.level_label}</div>
                <div className="p-4 font-body text-navy-800/75 text-sm">{row.full_time}</div>
                <div className="p-4 font-body text-navy-800/75 text-sm">{row.part_time}</div>
                <div className="p-4 font-body text-navy-800/75 text-sm">{row.internship}</div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gold-500/15">
            {rows.map(row => (
              <div key={row.level_label} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gold-700" />
                  <p className="font-body font-bold text-navy-900 text-sm">{row.level_label}</p>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="font-body text-navy-800/55">Full-time</dt>
                    <dd className="font-body text-navy-900 font-medium text-right">{row.full_time}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-body text-navy-800/55">Part-time</dt>
                    <dd className="font-body text-navy-900 font-medium text-right">{row.part_time}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-body text-navy-800/55">Internship</dt>
                    <dd className="font-body text-navy-900 font-medium text-right">{row.internship}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer banner */}
        <div className="flex items-start gap-3 mt-6 p-5 rounded-2xl bg-white/70 border border-gold-500/25">
          <AlertCircle className="w-5 h-5 text-gold-700 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="font-body font-semibold text-navy-900 text-sm leading-snug">Actual duration varies by institution.</p>
            <p className="font-body text-navy-800/65 text-sm leading-relaxed mt-1">
              Every Singapore private college sets its own intake schedule, credit structure, and internship integration. The numbers above are typical for the sector — confirm the exact duration on each programme&rsquo;s individual course page or with a PathPort advisor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
