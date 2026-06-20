import Image from "next/image";
import { Search } from "lucide-react";

/**
 * CoursesHeroImmersive — full-bleed photo hero for /courses.
 *
 * Layout: full-bleed classroom photo, display-2 headline, popular-category
 * chip strip, in-hero search form. Matches the homepage / colleges hero
 * pattern for visual continuity across the public site.
 */
const POPULAR_CATEGORIES = [
  "Business",
  "Information Technology",
  "Hospitality",
  "Engineering",
  "Design",
  "Mass Communication",
];

export default function CoursesHeroImmersive({ search = "" }: { search?: string }) {
  return (
    <section className="relative w-full min-h-[78vh] lg:min-h-[80vh] overflow-hidden bg-[#06142E]">
      <div aria-hidden className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=2400&q=80"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover object-center"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/60 to-navy-900/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/55 via-transparent to-transparent" />
      </div>

      <div className="relative layout-shell pt-[120px] pb-20 lg:pt-[140px] lg:pb-28 min-h-[78vh] lg:min-h-[80vh] flex items-center">
        <div className="max-w-4xl text-white">
          <span className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.18] backdrop-blur-sm rounded-full px-4 py-1.5 mb-8 text-xs font-body font-semibold tracking-[0.18em] text-white/85 uppercase">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            Singapore Diploma Programmes
          </span>

          <h1 className="display-2 text-white mb-6">
            Browse{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
              courses
            </span>{" "}
            that lead to real careers.
          </h1>

          <p className="lead text-white/75 mb-10 max-w-2xl">
            All listed programmes are offered by CPE-registered, EduTrust-certified colleges. Compare side-by-side, then apply through PathPort — free.
          </p>

          {/* Hero search */}
          <form method="GET" action="/courses" className="max-w-xl mb-8">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-800/40 pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search by title, subject, or college…"
                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white border border-white/30 text-navy-900 placeholder-navy-800/40 font-body text-base focus:outline-none focus:ring-4 focus:ring-pathBlue-500/25 transition-all shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)]"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2 max-w-2xl">
            <span className="text-white/55 font-body text-xs font-semibold mr-1 self-center uppercase tracking-wider">Popular:</span>
            {POPULAR_CATEGORIES.map(cat => (
              <a
                key={cat}
                href={`/courses?category=${encodeURIComponent(cat)}`}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.10] border border-white/[0.18] text-white/85 font-body text-xs font-semibold hover:bg-white/[0.18] transition-colors"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
