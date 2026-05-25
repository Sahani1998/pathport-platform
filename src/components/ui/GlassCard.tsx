import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  gold?: boolean;
}

/**
 * GlassCard — the core glassmorphism card primitive.
 * Accepts all standard div attributes, plus `hover` and `gold` style modifiers.
 */
export default function GlassCard({
  children,
  className,
  hover = true,
  gold = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        // Base glass
        "relative rounded-2xl border backdrop-blur-md",
        "bg-gradient-to-br from-white/[0.07] to-white/[0.02]",
        "shadow-glass",
        // Border colour
        gold ? "border-gold-500/40" : "border-white/10",
        // Hover states
        hover && [
          "transition-all duration-300 cursor-default",
          "hover:border-gold-500/45 hover:shadow-gold-sm",
          "hover:-translate-y-1",
          "hover:from-white/[0.09] hover:to-white/[0.03]",
        ],
        className
      )}
      {...props}
    >
      {/* Gold inner glow overlay */}
      {gold && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl pointer-events-none
                     bg-gradient-to-br from-gold-400/[0.08] to-transparent"
        />
      )}
      {children}
    </div>
  );
}
