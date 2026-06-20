import Image from "next/image";
import { Search } from "lucide-react";

/**
 * CollegesHeroImmersive — full-bleed photo hero for /colleges.
 *
 * Replaces the previous CollegesHero (1024px split, smaller typography).
 * Layout: full-bleed campus photo background, display-2 headline overlaid
 * with dark scrim, in-hero search form that submits to the directory below.
 */
export default function CollegesHeroImmersive({ search = "" }: { search?: string }) {
  return (
    <section className="relative w-full min-h-[78vh] lg:min-h-[80vh] overflow-hidden bg-[#06142E]">
      <div aria-hidden className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2400&q=80"
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
            Singapore Private Colleges
          </span>

          <h1 className="display-2 text-white mb-6">
            Find your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
              Singapore college.
            </span>
          </h1>

          <p className="lead text-white/75 mb-10 max-w-2xl">
            Every PathPort-listed college is CPE-registered and EduTrust-certified. Compare programmes, fees, and intake dates — then apply with one form.
          </p>

          {/* Hero search */}
          <form method="GET" action="/colleges" className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-800/40 pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search colleges by name…"
                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white border border-white/30 text-navy-900 placeholder-navy-800/40 font-body text-base focus:outline-none focus:ring-4 focus:ring-pathBlue-500/25 transition-all shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)]"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
              >
                Search
              </button>
            </div>
            <p className="text-white/55 font-body text-xs mt-3 ml-1">
              Or scroll to browse all verified institutions ↓
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
