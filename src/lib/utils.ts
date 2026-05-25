import type React from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — primary utility function. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Convert a string to a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

/** Stagger animation delay helper — returns inline style object. */
export function staggerDelay(index: number, base = 0.08): React.CSSProperties {
  return { animationDelay: `${index * base}s` };
}
