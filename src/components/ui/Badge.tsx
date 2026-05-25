import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/types";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = "gold", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full",
        "font-body text-xs font-semibold tracking-wide leading-none",
        variant === "gold"    && "bg-gold-400/15 text-gold-400 border border-gold-400/30",
        variant === "blue"    && "bg-pathBlue-500/15 text-pathBlue-400 border border-pathBlue-500/30",
        variant === "navy"    && "bg-navy-600/60 text-white/75 border border-white/10",
        variant === "success" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        variant === "muted"   && "bg-white/[0.06] text-white/45 border border-white/[0.08]",
        className
      )}
    >
      {children}
    </span>
  );
}
