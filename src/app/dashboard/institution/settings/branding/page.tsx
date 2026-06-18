import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect }          from "next/navigation";
import Link                  from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import BrandingForm from "@/components/media/BrandingForm";
import type { College } from "@/types/courses";

export const metadata = { title: "Branding Settings — Institution" };
export const dynamic  = "force-dynamic";

export default async function BrandingSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") redirect("/dashboard");

  if (!profile?.college_id) {
    return (
      <div className="max-w-2xl">
        <Link href="/dashboard/institution/settings"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-xs mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
        </Link>
        <div className="flex items-start gap-3 p-6 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm text-white/80 font-semibold mb-1">No college linked</p>
            <p className="font-body text-xs text-white/45">Your account is not linked to a college. Contact an admin to set this up.</p>
          </div>
        </div>
      </div>
    );
  }

  const adminDb = createAdminClient();
  const { data: college } = await adminDb
    .from("colleges")
    .select(`
      id, name, slug, logo_url, country, city, description, website,
      is_active, is_published, created_at,
      cover_image_url, tagline, brand_colour_primary, brand_colour_secondary,
      short_description, mission, vision, introduction
    `)
    .eq("id", profile.college_id)
    .single();

  if (!college) redirect("/dashboard");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/institution/settings"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-xs mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
        </Link>
        <h2 className="font-display text-3xl text-white mb-1">Branding</h2>
        <p className="text-white/40 font-body text-sm">
          Logo, cover image, tagline, brand colours, and institutional narrative shown on your public college page.
        </p>
      </div>

      <BrandingForm college={college as College} />
    </div>
  );
}
