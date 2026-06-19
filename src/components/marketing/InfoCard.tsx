import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface InfoCardProps {
  title:        string;
  description?: string;
  href?:        string;
  icon?:        ReactNode;
  eyebrow?:     string;
  children?:    ReactNode;
}

export default function InfoCard({ title, description, href, icon, eyebrow, children }: InfoCardProps) {
  const body = (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2.5xl p-7 h-full flex flex-col group hover:border-gold-400/35 hover:bg-gold-400/[0.04] hover:-translate-y-0.5 hover:shadow-warm transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/25 flex items-center justify-center text-gold-400 flex-shrink-0">
            {icon}
          </div>
        )}
        {href && <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-gold-400 transition-colors flex-shrink-0" />}
      </div>
      {eyebrow && <p className="text-white/30 font-body text-[10px] uppercase tracking-widest mb-1">{eyebrow}</p>}
      <h3 className="font-display text-xl text-white mb-2 leading-snug">{title}</h3>
      {description && <p className="text-white/50 font-body text-sm leading-relaxed flex-1">{description}</p>}
      {children}
    </div>
  );

  if (href) return <Link href={href} className="block h-full">{body}</Link>;
  return body;
}
