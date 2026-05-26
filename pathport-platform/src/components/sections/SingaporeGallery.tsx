"use client";

import { useState } from "react";

const IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
    alt: "Marina Bay Sands and Singapore skyline at night",
    label: "Marina Bay Sands",
    category: "landmark",
  },
  {
    src: "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=800&q=80",
    alt: "Singapore city skyline with financial district",
    label: "Singapore CBD",
    category: "landmark",
  },
  {
    src: "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=800&q=80",
    alt: "Gardens by the Bay Singapore Supertrees",
    label: "Gardens by the Bay",
    category: "landmark",
  },
  {
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
    alt: "International students studying together on campus",
    label: "Campus Life",
    category: "students",
  },
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    alt: "Students collaborating with laptops in a modern workspace",
    label: "Study & Collaborate",
    category: "students",
  },
  {
    src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80",
    alt: "Students in a bright modern classroom",
    label: "Classroom Learning",
    category: "students",
  },
];

const FILTERS = ["All", "Landmarks", "Student Life"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(category: string, filter: Filter): boolean {
  if (filter === "All")          return true;
  if (filter === "Landmarks")    return category === "landmark";
  if (filter === "Student Life") return category === "students";
  return true;
}

export default function SingaporeGallery() {
  const [filter, setFilter] = useState<Filter>("All");

  const visible = IMAGES.filter(img => matchesFilter(img.category, filter));

  return (
    <section className="relative py-20 overflow-hidden">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
            Life in Singapore
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
            See What Awaits You in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
              Singapore
            </span>
          </h2>
          <p className="text-white/45 font-body text-lg max-w-xl mx-auto">
            A world-class city, safe campuses, and a vibrant student community — just 5 hours from India.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex justify-center gap-2 mb-8" role="tablist">
          {FILTERS.map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full font-body text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? "bg-gold-400/20 border border-gold-400/45 text-gold-300"
                  : "bg-white/[0.04] border border-white/[0.09] text-white/48 hover:border-white/20 hover:text-white/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Image grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-live="polite"
        >
          {visible.map((img, i) => (
            <div
              key={img.src}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.08] hover:border-gold-400/35 transition-all duration-300 hover:-translate-y-1 hover:shadow-gold-sm"
              style={{ aspectRatio: "4/3" }}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading={i < 3 ? "eager" : "lazy"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent" />
              {/* Label */}
              <div className="absolute bottom-3 left-4">
                <span className="font-body text-sm font-semibold text-white/90 drop-shadow-md">
                  {img.label}
                </span>
              </div>
              {/* Category badge */}
              <div className="absolute top-3 right-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-body text-xs font-semibold backdrop-blur-sm border ${
                  img.category === "landmark"
                    ? "bg-gold-400/20 border-gold-400/40 text-gold-300"
                    : "bg-pathBlue-500/20 border-pathBlue-500/40 text-pathBlue-300"
                }`}>
                  {img.category === "landmark" ? "🇸🇬 Landmark" : "🎓 Student Life"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Caption */}
        <p className="text-center text-white/30 font-body text-xs mt-6 italic">
          Images are representative of Singapore. Actual campus and city experiences may vary.
        </p>
      </div>
    </section>
  );
}
