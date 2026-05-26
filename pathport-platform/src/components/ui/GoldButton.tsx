import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ButtonVariant, ButtonSize } from "@/types";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * PrimaryButton — supports gold-solid, blue-solid, gold-outline, blue-outline, ghost.
 * Default: solid-gold (matching PathPort brand CTA).
 */
export default function GoldButton({
  children,
  variant = "solid-gold",
  size = "md",
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center font-body font-semibold",
        "tracking-wide rounded-xl overflow-hidden select-none transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",

        // Sizes
        size === "sm" && "px-5 py-2.5 text-sm gap-1.5",
        size === "md" && "px-7 py-3.5 text-base gap-2",
        size === "lg" && "px-9 py-4 text-lg gap-2",

        // Variants
        variant === "solid-gold" && [
          "bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 text-navy-900",
          "hover:shadow-gold hover:scale-[1.03] active:scale-[0.98]",
          "focus-visible:ring-gold-400",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-gold-300 before:via-gold-200 before:to-gold-300",
          "before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        ],
        variant === "solid-blue" && [
          "bg-gradient-to-r from-pathBlue-600 via-pathBlue-500 to-pathBlue-400 text-white",
          "hover:shadow-blue hover:scale-[1.03] active:scale-[0.98]",
          "focus-visible:ring-pathBlue-400",
        ],
        variant === "outline-gold" && [
          "border-2 border-gold-400/70 text-gold-400 bg-transparent",
          "hover:border-gold-400 hover:text-gold-300 hover:bg-gold-400/[0.08] active:scale-[0.98]",
          "focus-visible:ring-gold-400",
        ],
        variant === "outline-blue" && [
          "border-2 border-pathBlue-400/70 text-pathBlue-400 bg-transparent",
          "hover:border-pathBlue-400 hover:bg-pathBlue-400/[0.08] active:scale-[0.98]",
          "focus-visible:ring-pathBlue-400",
        ],
        variant === "ghost" && [
          "text-white/60 bg-transparent hover:text-white hover:bg-white/[0.07] active:scale-[0.98]",
          "focus-visible:ring-white/40",
        ],

        className
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-[inherit]">{children}</span>
    </button>
  );
}
