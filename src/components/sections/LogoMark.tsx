"use client";

// LogoMark — a single institution logo with graceful fallback. If the logo
// image fails to load, it renders the college's initials in a bordered tile
// instead of a broken-image icon. Used inside InstitutionLogoWall.

import Image from "next/image";
import { useState } from "react";

interface LogoMarkProps {
  name: string;
  logoUrl: string;
  /** Hide from screen readers / tab order when this is a duplicated marquee item. */
  decorative?: boolean;
}

export default function LogoMark({ name, logoUrl, decorative }: LogoMarkProps) {
  const [failed, setFailed] = useState(false);

  const initials = name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (failed) {
    return (
      <span
        aria-hidden={decorative}
        className="flex h-12 md:h-14 min-w-[88px] items-center justify-center rounded-xl border border-navy-900/10 bg-navy-900/[0.03] px-4 font-display font-bold text-navy-900/60 text-lg"
      >
        {initials || "—"}
      </span>
    );
  }

  return (
    <Image
      src={logoUrl}
      alt={decorative ? "" : name}
      width={200}
      height={56}
      className="h-12 md:h-14 w-auto object-contain"
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
