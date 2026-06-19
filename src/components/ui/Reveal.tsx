"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  /** Render as a different element (default div). */
  as?: ElementType;
  /** Stagger delay in ms — use index * step for lists. */
  delay?: number;
  /** Fraction of element visible before triggering (default 0.15). */
  threshold?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Reveal — lightweight scroll-into-view animation primitive.
 *
 * Uses a single IntersectionObserver to add `.is-visible`, which CSS animates
 * (see globals.css `.reveal`). No animation library. Fully reduced-motion aware:
 * the global `prefers-reduced-motion` media query forces the element visible
 * with no transform, so content is never hidden from users who opt out.
 *
 * Animates once, then disconnects (no re-trigger on scroll-up).
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  threshold = 0.15,
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // SSR/no-IO fallback: show immediately.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
