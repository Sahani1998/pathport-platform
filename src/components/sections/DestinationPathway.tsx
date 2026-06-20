import { createAdminClient } from "@/lib/supabase/admin-client";
import Reveal from "@/components/ui/Reveal";

type DestinationStatus = "live" | "coming_soon" | "hidden";

interface DbDestination {
  id: string;
  slug: string;
  name: string;
  flag: string;
  headline: string;
  destination_status: DestinationStatus;
  display_order: number;
}

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

export default async function DestinationPathway() {
  const adminDb = createAdminClient();
  const { data } = await adminDb
    .from("public_destinations")
    .select("id, slug, name, flag, headline, destination_status, display_order")
    .eq("status", "published")
    .neq("destination_status", "hidden")
    .order("display_order");

  const destinations = (data ?? []) as DbDestination[];

  if (destinations.length === 0) return null;

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
          {destinations.map((d, i) => (
            <Reveal key={d.slug} delay={i * 50} className="h-full">
              <div
                className={`relative h-full p-5 rounded-2.5xl border ${
                  d.destination_status === "live"
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
                  <StatusChip status={d.destination_status} />
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
