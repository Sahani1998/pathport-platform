import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Pencil, Mail, Phone, Globe, Calendar, Plane, Users,
  GraduationCap, CheckCircle2, Circle,
} from "lucide-react";
import { computeProfileCompletion } from "@/lib/profile-completion";
import type { StudentEducation } from "@/types/auth";

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
}

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: education }] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        full_name, email, phone, country, role, created_at,
        date_of_birth, nationality,
        passport_number, passport_country, passport_expiry,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
      `)
      .eq("id", user.id)
      .single(),
    supabase
      .from("student_education")
      .select("*")
      .eq("user_id", user.id)
      .order("end_year", { ascending: false, nullsFirst: false }),
  ]);

  const eduList = (education ?? []) as StudentEducation[];
  const completion = profile
    ? computeProfileCompletion({ profile, education: eduList })
    : null;

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">My Profile</h2>
          <p className="text-white/40 font-body text-sm">View and manage your account details</p>
        </div>
        <Link href="/dashboard/student/profile/edit"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all flex-shrink-0">
          <Pencil className="w-3.5 h-3.5" /> Edit Profile
        </Link>
      </div>

      {/* Identity card */}
      <div className="flex items-center gap-5 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 text-navy-900 font-display font-bold text-2xl">
          {(profile?.full_name ?? user.email ?? "U")[0].toUpperCase()}
        </div>
        <div>
          <p className="font-display text-2xl text-white">{profile?.full_name ?? "—"}</p>
          <p className="text-white/40 font-body text-sm mt-0.5">{profile?.email ?? user.email}</p>
          <span className="inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full bg-gold-400/15 border border-gold-400/25 text-gold-400 font-body text-[10px] font-semibold tracking-wider uppercase">
            {profile?.role ?? "student"}
          </span>
        </div>
      </div>

      {/* Completion bar */}
      {completion && (
        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-lg text-white">Profile Completion</p>
            <p className={`font-display text-2xl font-bold ${
              completion.percent === 100 ? "text-emerald-400"
                : completion.percent >= 60 ? "text-gold-400"
                : "text-white/60"
            }`}>
              {completion.percent}%
            </p>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completion.percent === 100 ? "bg-emerald-400"
                  : completion.percent >= 60 ? "bg-gold-400"
                  : "bg-pathBlue-400"
              }`}
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {[
              { key: "personal",  label: "Personal" },
              { key: "passport",  label: "Passport" },
              { key: "emergency", label: "Emergency" },
              { key: "education", label: "Education" },
            ].map(({ key, label }) => {
              const section = completion.sections[key as keyof typeof completion.sections];
              return (
                <div key={key} className="flex items-center gap-2 text-xs font-body">
                  {section.complete
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />}
                  <span className={section.complete ? "text-white/65" : "text-white/35"}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal */}
      <DetailsCard title="Personal Information" items={[
        { icon: Mail,     label: "Email",         value: profile?.email ?? user.email ?? "—" },
        { icon: Phone,    label: "Phone",         value: profile?.phone },
        { icon: Globe,    label: "Country",       value: profile?.country },
        { icon: Calendar, label: "Date of Birth", value: fmtDate(profile?.date_of_birth) },
        { icon: Globe,    label: "Nationality",   value: profile?.nationality },
      ]} />

      {/* Passport */}
      <DetailsCard title="Passport Information" items={[
        { icon: Plane,    label: "Number",   value: profile?.passport_number },
        { icon: Globe,    label: "Country",  value: profile?.passport_country },
        { icon: Calendar, label: "Expiry",   value: fmtDate(profile?.passport_expiry) },
      ]} />

      {/* Emergency */}
      <DetailsCard title="Emergency Contact" items={[
        { icon: Users, label: "Name",         value: profile?.emergency_contact_name },
        { icon: Phone, label: "Phone",        value: profile?.emergency_contact_phone },
        { icon: Users, label: "Relationship", value: profile?.emergency_contact_relationship },
      ]} />

      {/* Education */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-400/10 border border-gold-400/25 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-gold-400" />
          </div>
          <p className="font-display text-lg text-white">Education History</p>
        </div>
        {eduList.length === 0 ? (
          <p className="text-white/35 font-body text-sm text-center py-8">No education entries yet</p>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {eduList.map(item => (
              <div key={item.id} className="px-6 py-4">
                <p className="text-white/85 font-body font-semibold text-sm">{item.institution_name}</p>
                <p className="text-white/45 font-body text-xs mt-0.5">
                  {item.qualification}{item.field_of_study ? ` · ${item.field_of_study}` : ""}
                </p>
                <p className="text-white/30 font-body text-xs mt-0.5">
                  {item.start_year ?? "?"} – {item.is_current ? "Present" : item.end_year ?? "?"}
                  {item.grade && ` · Grade: ${item.grade}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reusable details card ────────────────────────────────────────────────────

function DetailsCard({
  title, items,
}: {
  title: string;
  items: { icon: typeof Mail; label: string; value: string | null | undefined }[];
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <p className="font-display text-lg text-white">{title}</p>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-6 py-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gold-400/70" />
            </div>
            <div className="min-w-0">
              <p className="text-white/35 font-body text-[10px] uppercase tracking-wider">{label}</p>
              <p className={`font-body text-sm font-medium ${value ? "text-white/80" : "text-white/30 italic"}`}>
                {value || "Not set"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
