import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  /** Make the title text gold-gradient instead of white */
  gold?: boolean;
  /** Render in dark-on-light mode — use on cream/white section backgrounds */
  dark?: boolean;
}

/**
 * SectionHeader — consistent eyebrow + heading + subtitle pattern used
 * across all homepage sections.
 */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
  gold = false,
  dark = false,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-16", centered && "text-center", className)}>
      {eyebrow && (
        <p className={cn(
          "inline-flex items-center gap-3 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5",
          dark ? "text-gold-700" : "text-gold-400"
        )}>
          <span className={cn("w-8 h-px rounded-full", dark ? "bg-gold-700/50" : "bg-gold-400/50")} />
          {eyebrow}
          <span className={cn("w-8 h-px rounded-full", dark ? "bg-gold-700/50" : "bg-gold-400/50")} />
        </p>
      )}

      <h2
        className={cn(
          "font-display text-4xl md:text-[2.9rem] lg:text-5xl leading-[1.08]",
          dark
            ? "text-navy-900"
            : gold
              ? "text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500"
              : "text-white/95"
        )}
      >
        {title}
      </h2>

      {subtitle && (
        <p className={cn(
          "mt-5 font-body text-lg leading-relaxed max-w-2xl mx-auto",
          dark ? "text-navy-800/65" : "text-white/50"
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
