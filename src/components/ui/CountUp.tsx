"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** The final value to count to. */
  value: number;
  /** Animation duration in ms (default 1600). */
  duration?: number;
  /** Text rendered before the number (e.g. ""). */
  prefix?: string;
  /** Text rendered after the number (e.g. "+", "hrs"). */
  suffix?: string;
  className?: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * CountUp — counts from 0 to `value` once the element scrolls into view.
 *
 * IntersectionObserver triggers a requestAnimationFrame ease-out tween. No
 * animation library. If the user prefers reduced motion, the final value is
 * shown instantly. Accessible: the live region is polite and the final value
 * is always the rendered text content.
 */
export default function CountUp({
  value,
  duration = 1600,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const elapsed = now - start;
          const t = Math.min(1, elapsed / duration);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(eased * value));
          if (t < 1) requestAnimationFrame(tick);
          else setDisplay(value);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toLocaleString("en-SG")}{suffix}
    </span>
  );
}
