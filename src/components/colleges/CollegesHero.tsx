import Image from "next/image";
import { Search } from "lucide-react";

/**
 * CollegesHero — light hero band for the /colleges directory.
 * Full-bleed photo on the right, headline + subhead + quick search on the left.
 */
export default function CollegesHero({ search = "" }: { search?: string }) {
  return (
    <section className="relative public-section-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">

          {/* Text + search */}
          <div>
            <p className="text-pathBlue-700 font-body text-xs font-semibold tracking-[0.20em] uppercase mb-4">
              Singapore Private Colleges
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] text-navy-900 leading-[1.05] tracking-tight mb-5">
              Find your Singapore{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                college.
              </span>
            </h1>
            <p className="text-navy-800/60 font-body text-lg leading-relaxed mb-7 max-w-xl">
              Every PathPort-listed college is CPE-registered and verified. Compare programmes, fees, and intake dates — then apply with one form.
            </p>

            <form method="GET" action="/colleges" className="max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/40 pointer-events-none" />
                <input
                  type="search"
                  name="q"
                  defaultValue={search}
                  placeholder="Search colleges by name…"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-navy-900 placeholder-navy-800/35 font-body text-sm focus:outline-none focus:border-pathBlue-500/60 focus:ring-2 focus:ring-pathBlue-500/15 transition-all"
                />
              </div>
              <p className="text-navy-800/45 font-body text-xs mt-3">
                Or scroll to browse all verified institutions ↓
              </p>
            </form>
          </div>

          {/* Hero photo — Singapore skyline */}
          <div className="relative">
            <div className="relative aspect-[5/4] rounded-3xl overflow-hidden border border-slate-200 shadow-[0_20px_50px_-15px_rgba(10,17,34,0.18)]">
              <Image
                src="https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80"
                alt="Marina Bay Sands and Singapore skyline"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
                unoptimized
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-900/20 via-transparent to-transparent" />
            </div>
            {/* Floating chip */}
            <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-[0_8px_24px_-8px_rgba(10,17,34,0.18)]">
              <p className="text-navy-800/55 font-body text-xs">All programmes</p>
              <p className="text-navy-900 font-display font-bold text-lg leading-none mt-0.5">EduTrust-certified</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
