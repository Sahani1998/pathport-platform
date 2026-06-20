import Link from "next/link";
import Image from "next/image";
import { ArrowRight, GraduationCap, MapPin, Briefcase } from "lucide-react";

/**
 * UniversityProgressionOpportunities — white section. Honest framing about
 * what diploma graduates can do next: advanced standing into degrees, direct
 * employment, or further specialisation. Avoids overselling — no fake stats.
 */
const OPTIONS = [
  {
    Icon: GraduationCap,
    label: "Advanced standing university entry",
    body: "Many Singapore diplomas qualify graduates for direct entry into Year 2 or Year 3 of degree programmes at universities in Singapore, the UK, Australia, and Canada. Each university sets its own credit-transfer policy.",
  },
  {
    Icon: Briefcase,
    label: "Direct employment in Singapore and India",
    body: "Some students choose to enter the workforce straight after a diploma — either remaining in Singapore on a relevant work pass (subject to MOM rules) or returning to India with international credentials and work experience.",
  },
  {
    Icon: MapPin,
    label: "Further specialisation in Singapore",
    body: "Diploma holders can stack qualifications — Advanced Diploma, Higher Diploma, or Specialist Diploma — to build deeper subject expertise without committing to a full degree programme.",
  },
];

export default function UniversityProgressionOpportunities() {
  return (
    <section className="relative public-section-white">
      <div className="layout-shell section-airy">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">

          {/* Image */}
          <div className="relative order-last lg:order-first">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_30px_70px_-25px_rgba(10,17,34,0.35)]">
              <Image
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80"
                alt="Diploma graduates at a Singapore campus"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                unoptimized
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-900/15 via-transparent to-transparent" />
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="eyebrow text-pathBlue-700 mb-5">After Your Diploma</p>
            <h2 className="display-3 text-navy-900 mb-6">
              Three honest paths a Singapore diploma can{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                open.
              </span>
            </h2>
            <p className="prose-lg text-navy-800/70 mb-8">
              A Singapore diploma is not the end of the road. It&rsquo;s a foundation that can be built on — academically, professionally, or both.
            </p>

            <div className="space-y-4">
              {OPTIONS.map(({ Icon, label, body }) => (
                <div key={label} className="flex items-start gap-4 p-5 rounded-2xl bg-pathBlue-500/5 border border-pathBlue-500/15">
                  <div className="w-10 h-10 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-navy-900 text-sm mb-1 leading-snug">{label}</p>
                    <p className="text-navy-800/65 font-body text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/resources/careers"
              className="inline-flex items-center gap-2 mt-7 text-pathBlue-700 hover:text-pathBlue-600 font-body text-sm font-semibold transition-colors"
            >
              See the careers and progression guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
