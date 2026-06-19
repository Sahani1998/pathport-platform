interface PageHeroProps {
  eyebrow?:  string;
  title:     string;
  subtitle?: string;
}

export default function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  return (
    <div className="mb-14 md:mb-16">
      {eyebrow && (
        <p className="text-gold-400/75 font-body text-xs font-semibold uppercase tracking-[0.22em] mb-5">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] text-white leading-[1.05] tracking-tight mb-6">
        {title}
      </h1>
      {subtitle && (
        <p className="font-body text-white/60 text-lg md:text-[1.15rem] leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
