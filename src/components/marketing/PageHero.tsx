interface PageHeroProps {
  eyebrow?:  string;
  title:     string;
  subtitle?: string;
}

export default function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  return (
    <div className="mb-12">
      {eyebrow && (
        <p className="text-gold-400/70 font-body text-xs font-semibold uppercase tracking-[0.22em] mb-4">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] mb-5">
        {title}
      </h1>
      {subtitle && (
        <p className="font-body text-white/55 text-lg leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
