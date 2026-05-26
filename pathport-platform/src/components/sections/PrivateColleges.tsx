"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import GoldButton from "@/components/ui/GoldButton";
import { privateColleges, COLLEGE_SPECIALISMS, type CollegeSpecialism } from "@/data/private-colleges";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PrivateColleges() {
  const [filter, setFilter] = useState<CollegeSpecialism>("All");

  const filtered = filter === "All"
    ? privateColleges
    : privateColleges.filter(c => c.specialisms.includes(filter));

  return (
    <section id="colleges" className="relative py-24">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <SectionHeader
          eyebrow="Singapore Private Colleges"
          title="Explore Your Singapore College Options"
          subtitle="Explore Singapore private college options for diploma, advanced diploma, higher diploma, and specialist diploma pathways. PathPort helps students compare programmes, prepare documents, and submit applications."
        />

        {/* Fee callout */}
        <div className="max-w-2xl mx-auto mb-10 text-center p-4 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
          <p className="text-white/65 font-body text-sm">
            💰 Course fees typically range from{" "}
            <strong className="text-gold-300">SGD 4,000 to SGD 8,000 per year</strong>
            {" "}— PathPort advisors help you find options that fit your budget.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10" role="tablist">
          {COLLEGE_SPECIALISMS.map(spec => (
            <button
              key={spec}
              role="tab"
              aria-selected={filter === spec}
              onClick={() => setFilter(spec)}
              className={cn(
                "px-5 py-2 rounded-full font-body text-sm font-medium transition-all duration-200",
                filter === spec
                  ? "bg-gold-400/20 border border-gold-400/45 text-gold-300"
                  : "bg-white/[0.04] border border-white/[0.09] text-white/48 hover:border-white/20 hover:text-white/70"
              )}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* College cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
          {filtered.map((college, i) => (
            <GlassCard key={college.id} className="p-6 group">
              <div className="flex items-start justify-between gap-3 mb-3">
                {/* College initial avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pathBlue-700 to-pathBlue-900 border border-pathBlue-500/30 flex items-center justify-center flex-shrink-0 shadow-blue-sm">
                  <span className="font-display font-bold text-pathBlue-300 text-base leading-none">
                    {(college.shortName ?? college.name).slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-body font-semibold text-white/90 text-sm leading-snug">{college.name}</h3>
                </div>
              </div>

              {/* Popular label */}
              <p className="text-white/35 font-body text-xs mb-3 italic">
                Popular Singapore private college option
              </p>

              {/* Specialisms */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {college.specialisms.map(s => (
                  <Badge key={s} variant="navy">{s}</Badge>
                ))}
              </div>

              {/* Intakes */}
              <div className="flex items-center gap-2 text-white/38 font-body text-xs">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Intakes: {college.intakes.join(" · ")}</span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* CTA note */}
        <div className="mt-10 text-center">
          <p className="text-white/40 font-body text-sm mb-4">
            Not sure which college is right for you? PathPort advisors help you compare options based on your budget, course interest, and background.
          </p>
          <GoldButton variant="outline-gold" size="md">
            Get a Free College Comparison
          </GoldButton>
        </div>
      </div>
    </section>
  );
}
