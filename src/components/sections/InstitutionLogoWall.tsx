import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin-client";

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

  return (
    <section className="py-12 border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <p className="text-center text-white/35 font-body text-[10px] uppercase tracking-[0.18em] mb-8">
          Verified institutions on PathPort
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {colleges.map(c => (
            <Link
              key={c.id}
              href={`/colleges/${c.slug}`}
              title={c.name}
              className="opacity-70 hover:opacity-100 transition-all duration-300"
            >
              <Image
                src={c.logo_url!}
                alt={c.name}
                width={100}
                height={44}
                className="h-8 w-auto object-contain"
                unoptimized
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
