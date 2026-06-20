import Reveal from "@/components/ui/Reveal";

/**
 * DestinationPathway — country/destination strip.
 *
 * SPRINT 31 NOTE: This data is intentionally hardcoded for PR-G. Sprint 31
 * will introduce a `public_destinations` DB table and swap this constant
 * for a server-side fetch — the visual layout below stays as-is, only the
 * data source changes. Status semantics (live / coming_soon / hidden) are
 * the same as the planned DB enum.
 *
 * Honesty rule: we do NOT imply PathPort supports a country unless its
 * status is "live". Coming-soon countries are clearly marked.
 */

type DestinationStatus = "live" | "coming_soon" | "hidden";

interface Destination {
  slug: string;
  name: string;
  flag: string;     // emoji flag — replaced with real flag images at admin's discretion in Sprint 31
  headline: string;
  status: DestinationStatus;
}

// TODO Sprint 31: replace with `SELECT * FROM public_destinations WHERE is_published = true ORDER BY display_order`.
const DESTINATIONS: Destination[] = [
  { slug: "singapore",      name: "Singapore",     flag: "🇸🇬", headline: "Diploma, advanced & higher diploma programmes.", status: "live"        },
  { slug: "australia",      name: "Australia",     flag: "🇦🇺", headline: "Diploma and university pathway programmes.",     status: "coming_soon" },
  { slug: "new-zealand",    name: "New Zealand",   flag: "🇳🇿", headline: "Diploma and university pathway programmes.",     status: "coming_soon" },
  { slug: "canada",         name: "Canada",        flag: "🇨🇦", headline: "College diploma and PGWP-eligible pathways.",    status: "coming_soon" },
  { slug: "united-kingdom", name: "United Kingdom",flag: "🇬🇧", headline: "Foundation, diploma and degree pathways.",       status: "coming_soon" },
  { slug: "europe",         name: "Europe",        flag: "🇪🇺", headline: "Diploma and bachelor pathways across the EU.",   status: "coming_soon" },
];

function StatusChip({ status }: { status: DestinationStatus }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-body text-[10px] font-semibold uppercase tracking-wider">
        <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-navy-900/[0.06] border border-navy-900/15 text-navy-800/65 font-body text-[10px] font-semibold uppercase tracking-wider">
      Coming soon
    </span>
  );
}

export default function DestinationPathway() {
  const visible = DESTINATIONS.filter(d => d.status !== "hidden");

  return (
    <section className="relative public-section-blue overflow-hidden">
      <div className="layout-shell section-medium">
        <Reveal className="max-w-3xl mb-12">
          <p className="eyebrow text-gold-700 mb-4">Destinations</p>
          <h2 className="display-2 text-navy-900 mb-5">
            Singapore today.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
              More on the way.
            </span>
          </h2>
          <p className="prose-lg text-navy-800/65">
            PathPort starts with Singapore — the destination we know best. Other study destinations are in active onboarding and will go live as our partner network and operations are ready.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {visible.map((d, i) => (
            <Reveal key={d.slug} delay={i * 50} className="h-full">
              <div
                className={`relative h-full p-5 rounded-2.5xl border ${
                  d.status === "live"
                    ? "bg-white border-emerald-500/30 ring-1 ring-emerald-500/15"
                    : "bg-white/60 border-slate-200"
                } public-card-hover`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    aria-hidden
                    className="text-3xl md:text-4xl leading-none select-none"
                    role="img"
                  >
                    {d.flag}
                  </span>
                  <StatusChip status={d.status} />
                </div>
                <p className="font-display text-lg text-navy-900 leading-tight mb-1.5">{d.name}</p>
                <p className="font-body text-navy-800/55 text-xs leading-relaxed">{d.headline}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-navy-800/50 font-body text-sm">
          Coming-soon destinations are listed for transparency. PathPort currently only processes applications for live destinations.
        </p>
      </div>
    </section>
  );
}
