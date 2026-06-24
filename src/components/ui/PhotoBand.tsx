import SafeImage from "@/components/ui/SafeImage";

interface PhotoBandProps {
  /** Image URL. Unsplash, Supabase Storage, or any absolute URL. */
  src: string;
  /** Descriptive alt text. */
  alt: string;
  /** Optional caption rendered as a chip in the corner. */
  caption?: string;
  /** Band height in Tailwind size units. */
  height?: "sm" | "md" | "lg";
  /** Where to anchor the caption chip. */
  captionPosition?: "left" | "right";
  /** Dim the photo with a navy overlay for higher caption contrast. */
  overlay?: boolean;
}

const HEIGHTS = {
  sm: "h-48 md:h-56",
  md: "h-64 md:h-80",
  lg: "h-80 md:h-[440px]",
};

/**
 * PhotoBand — reusable edge-to-edge photo strip used as a "rest beat" between
 * content sections on public marketing pages. Categories supported via the
 * `alt`/`caption` text only; no fabricated testimonials, no fabricated stats.
 *
 * Drop between any two `public-section-*` bands. Renders full-bleed (the
 * parent should NOT clip it inside `max-w-7xl` — place it as a direct child
 * of `<main>` or use `mx-[calc(50%-50vw)] w-screen` if you need to break out
 * of a container.
 */
export default function PhotoBand({
  src,
  alt,
  caption,
  height = "md",
  captionPosition = "left",
  overlay = true,
}: PhotoBandProps) {
  return (
    <section className={`relative w-full ${HEIGHTS[height]} overflow-hidden bg-navy-900`}>
      <SafeImage
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className="object-cover"
        unoptimized
      />
      {overlay && (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy-900/35 via-transparent to-navy-900/10 pointer-events-none"
        />
      )}
      {caption && (
        <div
          className={`absolute bottom-5 ${captionPosition === "left" ? "left-5 md:left-10" : "right-5 md:right-10"}`}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-sm border border-white shadow-[0_4px_16px_-4px_rgba(10,17,34,0.25)] font-body text-xs font-semibold text-navy-900">
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0"
            />
            {caption}
          </span>
        </div>
      )}
    </section>
  );
}
