import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { Briefcase, ArrowRight, Code, Coffee, Building2, PenTool, Megaphone, HeartHandshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * CareerOutcomes — white section. Honest, category-by-category overview of
 * where Singapore diploma graduates typically end up. No fabricated salary
 * figures, no fake placement stats — just the realistic landscape, by sector.
 *
 * Each card lists 3 honest role types graduates pursue and links to /resources/careers
 * for the deeper guide.
 */

interface Sector {
  Icon: LucideIcon;
  sector: string;
  roles: readonly string[];
  notes: string;
}

const SECTORS: Sector[] = [
  {
    Icon: Building2,
    sector: "Business & Management",
    roles: ["Business Operations Analyst", "Sales / Account Executive", "Marketing Coordinator"],
    notes: "The broadest sector. Most diploma graduates find their first role here — operations, sales, marketing, or junior account management — at SMEs, MNCs, and start-ups across Singapore and India.",
  },
  {
    Icon: Code,
    sector: "Information Technology",
    roles: ["Junior Software Engineer", "IT Support Specialist", "Data Analyst"],
    notes: "Strong demand in both Singapore and Bangalore/Hyderabad. IT diplomas with internship components are particularly competitive — many graduates land technical roles at FinTech, e-commerce, and SaaS companies.",
  },
  {
    Icon: Coffee,
    sector: "Hospitality & Tourism",
    roles: ["Hotel Operations Trainee", "Restaurant Floor Manager", "Events Coordinator"],
    notes: "Singapore is a hub for luxury hospitality. Diploma graduates often start in supervisory or trainee management programmes at international hotel chains, restaurant groups, and conference venues.",
  },
  {
    Icon: PenTool,
    sector: "Design & Creative",
    roles: ["Junior UX/UI Designer", "Brand & Visual Designer", "Motion / Video Designer"],
    notes: "Smaller but growing. Design diploma graduates often work agency-side or in-house creative teams. Singapore&rsquo;s start-up scene has created consistent demand for product designers.",
  },
  {
    Icon: Megaphone,
    sector: "Mass Communication",
    roles: ["Content Producer", "Junior PR / Communications Executive", "Digital Marketing Specialist"],
    notes: "Roles span agency, brand-side, and media. Graduates often work in social media, brand campaigns, journalism, or production. Useful pathway into broader marketing careers.",
  },
  {
    Icon: HeartHandshake,
    sector: "Education & Healthcare Support",
    roles: ["Early Childhood Educator", "Healthcare Administrator", "Allied Health Assistant"],
    notes: "Specialised programmes (Early Childhood Education, Healthcare Management, Psychology) lead into care, education, and clinical-support roles. Often regulated — confirm licensing requirements with your college.",
  },
];

export default function CareerOutcomes() {
  return (
    <section id="careers" className="relative public-section-white">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-20">
        <Reveal className="text-center mb-12">
          <p className="text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
            Career Outcomes
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1] mb-4 max-w-2xl mx-auto">
            Where Singapore diploma graduates actually work.
          </h2>
          <p className="text-navy-800/60 font-body text-base max-w-2xl mx-auto leading-relaxed">
            Honest snapshots by sector — based on what PathPort partner colleges report. Outcomes vary by programme, internship performance, and the individual student.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {SECTORS.map(({ Icon, sector, roles, notes }, i) => (
            <Reveal key={sector} delay={i * 60} className="h-full">
              <div className="h-full p-6 rounded-2.5xl public-card public-card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-body font-semibold text-navy-900 text-base leading-snug">{sector}</h3>
                </div>

                <p className="font-body text-navy-800/50 text-[10px] font-semibold uppercase tracking-wider mb-2">Common first roles</p>
                <ul className="space-y-1.5 mb-4">
                  {roles.map(role => (
                    <li key={role} className="flex items-start gap-2 text-navy-800/75 font-body text-sm">
                      <Briefcase className="w-3.5 h-3.5 text-pathBlue-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                      <span>{role}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-navy-800/60 font-body text-xs leading-relaxed">{notes}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/resources/careers"
            className="inline-flex items-center gap-2 text-pathBlue-700 hover:text-pathBlue-600 font-body text-sm font-semibold transition-colors"
          >
            Read the full careers guide
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
