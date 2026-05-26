"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState, useCallback } from "react";
import { COURSE_CATEGORIES } from "@/types/courses";
import { cn } from "@/lib/utils";

interface CourseFiltersProps {
  currentSearch?:   string;
  currentCategory?: string;
  currentLevel?:    string;
  currentStatus?:   string;
}

const LEVELS = [
  { value: "diploma",           label: "Diploma"           },
  { value: "advanced_diploma",  label: "Advanced Diploma"  },
  { value: "graduate_diploma",  label: "Graduate Diploma"  },
  { value: "certificate",       label: "Certificate"       },
];

export default function CourseFilters({
  currentSearch   = "",
  currentCategory = "",
  currentLevel    = "",
  currentStatus   = "",
}: CourseFiltersProps) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();
  const [showMobile, setShowMobile] = useState(false);

  const hasFilters = currentSearch || currentCategory || currentLevel || currentStatus;

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset pagination on filter change
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const clearAll = () => router.push(pathname);

  const FilterContent = () => (
    <div className="space-y-5">

      {/* Search */}
      <div>
        <label className="text-white/40 font-body text-xs uppercase tracking-widest mb-2 block">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Course or college…"
            defaultValue={currentSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("search", (e.target as HTMLInputElement).value.trim());
              }
            }}
            onBlur={(e) => updateParam("search", e.target.value.trim())}
            className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl pl-9 pr-4 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-all"
          />
          {currentSearch && (
            <button onClick={() => updateParam("search", "")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-white/40 font-body text-xs uppercase tracking-widest mb-2 block">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {COURSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateParam("category", currentCategory === cat ? "" : cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-body text-xs font-medium border transition-all",
                currentCategory === cat
                  ? "bg-gold-400/20 border-gold-400/40 text-gold-300"
                  : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white/75"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div>
        <label className="text-white/40 font-body text-xs uppercase tracking-widest mb-2 block">Level</label>
        <div className="space-y-1.5">
          {LEVELS.map((lv) => (
            <button
              key={lv.value}
              onClick={() => updateParam("level", currentLevel === lv.value ? "" : lv.value)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl font-body text-sm border transition-all",
                currentLevel === lv.value
                  ? "bg-pathBlue-500/15 border-pathBlue-500/30 text-pathBlue-300"
                  : "bg-white/[0.03] border-transparent text-white/50 hover:border-white/[0.10] hover:text-white/75"
              )}
            >
              {lv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="text-white/40 font-body text-xs uppercase tracking-widest mb-2 block">Availability</label>
        <div className="flex gap-2">
          {[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }].map((s) => (
            <button
              key={s.value}
              onClick={() => updateParam("status", currentStatus === s.value ? "" : s.value)}
              className={cn(
                "flex-1 py-2 rounded-xl font-body text-xs font-semibold border transition-all",
                currentStatus === s.value
                  ? s.value === "open"
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-400"
                    : "bg-red-500/15 border-red-400/30 text-red-400"
                  : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:border-white/20"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="w-full py-2 rounded-xl font-body text-xs text-white/40 hover:text-white/70 border border-white/[0.07] hover:border-white/[0.14] transition-all"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobile(!showMobile)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/60 font-body text-sm hover:border-white/20 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-gold-400 inline-block ml-1" />}
        </button>
        {showMobile && (
          <div className="mt-3 p-4 bg-navy-800/80 border border-white/[0.09] rounded-2xl">
            <FilterContent />
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>
    </>
  );
}
