// DB-driven platform statistics band. Counts are live from the database
// (verified institutions, published programmes). Pathway/medium figures are
// fixed platform facts. No sensitive operational counts (applications, offer
// letters) are exposed. Numbers animate via <CountUp> on scroll-in.

import { createAdminClient } from "@/lib/supabase/admin-client";
import CountUp from "@/components/ui/CountUp";
import Reveal from "@/components/ui/Reveal";
import { BadgeCheck, BookOpen, Layers, Languages } from "lucide-react";

export default async function PlatformStats() {
  const adminDb = createAdminClient();

  const [{ count: institutionCount }, { count: courseCount }] = await Promise.all([
    adminDb
      .from("colleges")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("is_published", true),
    adminDb
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .neq("status", "draft"),
  ]);

  const stats = [
    {
      Icon: BadgeCheck,
      value: institutionCount ?? 0,
      suffix: "",
      label: "Verified Institutions",
      sub: "Every college CPE-checked",
    },
    {
      Icon: BookOpen,
      value: courseCount ?? 0,
      suffix: "",
      label: "Programmes Available",
      sub: "Diploma to higher diploma",
    },
    {
      Icon: Layers,
      value: 4,
      suffix: "",
      label: "Diploma Pathways",
      sub: "Diploma · Advanced · Higher · Specialist",
    },
    {
      Icon: Languages,
      value: 100,
      suffix: "%",
      label: "English Medium",
      sub: "No language barrier from day one",
    },
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div aria-hidden className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-800/20 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map(({ Icon, value, suffix, label, sub }, i) => (
            <Reveal
              key={label}
              delay={i * 90}
              className="group text-center p-5 md:p-6 rounded-2.5xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/30 hover:bg-white/[0.05] transition-colors duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/25 flex items-center justify-center text-gold-400 mx-auto mb-3 group-hover:scale-105 transition-transform duration-300">
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <p className="font-display text-3xl md:text-4xl text-gold-400 font-bold leading-none mb-2">
                <CountUp value={value} suffix={suffix} />
              </p>
              <p className="font-body font-semibold text-white/85 text-sm leading-snug">{label}</p>
              <p className="font-body text-white/40 text-xs mt-1 leading-snug">{sub}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
