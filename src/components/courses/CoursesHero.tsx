import { Search } from "lucide-react";

/**
 * CoursesHero — light hero band for the /courses directory.
 * Headline + subhead on the left, quick search on the right.
 * Compact: no oversized photo — the value here is the programme list below.
 */
const POPULAR_CATEGORIES = [
  "Business", "Information Technology", "Hospitality",
  "Engineering", "Design", "Mass Communication",
];

export default function CoursesHero({ search = "" }: { search?: string }) {
  return (
    <section className="relative public-section-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">

          {/* Text */}
          <div>
            <p className="text-pathBlue-700 font-body text-xs font-semibold tracking-[0.20em] uppercase mb-4">
              Singapore Diploma Programmes
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] text-navy-900 leading-[1.05] tracking-tight mb-5">
              Browse{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                courses
              </span>{" "}
              by subject, level, or college.
            </h1>
            <p className="text-navy-800/60 font-body text-lg leading-relaxed mb-7 max-w-xl">
              All listed programmes are offered by CPE-registered, EduTrust-certified colleges. Compare side-by-side, then apply through PathPort.
            </p>

            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-navy-800/55 font-body text-xs font-semibold mr-1 self-center">Popular:</span>
              {POPULAR_CATEGORIES.map(cat => (
                <a
                  key={cat}
                  href={`/courses?category=${encodeURIComponent(cat)}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 font-body text-xs font-semibold hover:bg-pathBlue-500/15 transition-colors"
                >
                  {cat}
                </a>
              ))}
            </div>
          </div>

          {/* Quick search panel */}
          <form method="GET" action="/courses" className="relative">
            <div className="rounded-3xl public-card p-6">
              <p className="font-body text-navy-800/55 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Quick search</p>
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/40 pointer-events-none" />
                <input
                  type="search"
                  name="q"
                  defaultValue={search}
                  placeholder="Search by title, subject, or college…"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-navy-900 placeholder-navy-800/35 font-body text-sm focus:outline-none focus:border-pathBlue-500/60 focus:ring-2 focus:ring-pathBlue-500/15 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
              >
                Search programmes
              </button>
              <p className="text-center text-navy-800/45 font-body text-xs mt-3">
                Or use the filters below to refine by level, fees, and duration.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
