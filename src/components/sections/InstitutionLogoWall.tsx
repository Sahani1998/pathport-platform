import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { CSSProperties } from "react";

export default async function InstitutionLogoWall() {
  const adminDb = createAdminClient();
  const { data } = await adminDb
    .from("colleges")
    .select("id, name, slug, logo_url")
    .eq("is_active",    true)
    .eq("is_published", true)
    .not("logo_url",    "is", null)
    .order("name");

  const colleges = (data ?? []).filter(c => c.logo_url);

  // Auto-hide the section if no logos have been uploaded yet
  if (colleges.length === 0) return null;

  // Scale loop duration to logo count so few logos don't whip past too fast.
  const duration = Math.max(28, colleges.length * 6);

  // Rendered twice back-to-back; the track translates -50% for a seamless loop.
  const renderLogo = (c: (typeof colleges)[number], dup: boolean) => (
    <Link
      key={`${dup ? "b" : "a"}-${c.id}`}
      href={`/colleges/${c.slug}`}
      title={c.name}
      aria-hidden={dup}
      tabIndex={dup ? -1 : undefined}
      className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity duration-300"
    >
      <Image
        src={c.logo_url!}
        alt={dup ? "" : c.name}
        width={110}
        height={44}
        className="h-8 w-auto object-contain"
        unoptimized
      />
    </Link>
  );

  return (
    <section className="py-12 border-t border-navy-900/10 overflow-hidden public-section-white">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <p className="text-center text-navy-800/45 font-body text-[10px] uppercase tracking-[0.18em] mb-8">
          Verified institutions on PathPort
        </p>

        <div className="marquee-group relative">
          {/* Edge fades blend the loop into the white page background */}
          <div aria-hidden className="absolute inset-y-0 left-0 w-16 md:w-24 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div aria-hidden className="absolute inset-y-0 right-0 w-16 md:w-24 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />

          <div
            className="marquee-track flex w-max items-center gap-10 md:gap-16"
            style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
          >
            {colleges.map(c => renderLogo(c, false))}
            {colleges.map(c => renderLogo(c, true))}
          </div>
        </div>
      </div>
    </section>
  );
}
