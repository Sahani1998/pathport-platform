import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import { loadStudentProfiles } from "@/lib/student-profiles";
import Link from "next/link";
import {
  Award, Users, FileText, CreditCard, Building2, Bell,
  ChevronRight, CheckCircle2, Clock
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruitment_partner") redirect("/dashboard");

  const partnerName = profile?.full_name ?? "Partner";
  const db = createAdminClient();

  // ── Fetch stats ──────────────────────────────────────────────────────────
  const [
    { count: totalStudents },
    { data: commissions },
    { count: unreadNotifs },
  ] = await Promise.all([
    db.from("partner_students")
      .select("*", { count: "exact", head: true })
      .eq("partner_id", user.id),

    db.from("partner_commissions")
      .select("amount_cents, currency, status")
      .eq("partner_id", user.id),

    db.from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  // ── Fetch recent students with their applications ─────────────────────────
  // partner_students.student_id → auth.users (no FK to profiles) — batch-load.
  const { data: recentStudentsRows } = await db
    .from("partner_students")
    .select(`id, referred_at, student_id`)
    .eq("partner_id", user.id)
    .order("referred_at", { ascending: false })
    .limit(5);

  const recentStudentProfileMap = await loadStudentProfiles(db, (recentStudentsRows ?? []).map((r: Record<string,unknown>) => r.student_id as string));
  const recentStudentsRaw = (recentStudentsRows ?? []).map((r: Record<string,unknown>) => ({
    ...r,
    student: recentStudentProfileMap.get(r.student_id as string) ?? null,
  }));

  // ── Fetch recent applications from partner's students ─────────────────────
  const studentIds = (recentStudentsRaw ?? [])
    .map((r: Record<string,unknown>) => {
      const s = r.student as Record<string,unknown> | null;
      return s?.id as string | undefined;
    })
    .filter((id): id is string => Boolean(id));

  const { data: recentAppsRaw } = studentIds.length > 0
    ? await db
        .from("applications")
        .select(`
          id, current_stage, status, submitted_at, student_id,
          courses ( title, colleges ( name ) )
        `)
        .in("student_id", studentIds)
        .order("submitted_at", { ascending: false })
        .limit(5)
    : { data: [] };

  // applications.student_id → auth.users (no FK to profiles) — batch-load profiles
  const recentProfileMap = await loadStudentProfiles(db, (recentAppsRaw ?? []).map((a: Record<string,unknown>) => a.student_id as string));
  const recentApps = (recentAppsRaw ?? []).map((a: Record<string,unknown>) => ({
    ...a,
    student: recentProfileMap.get(a.student_id as string) ?? null,
  }));

  // ── Commission stats ───────────────────────────────────────────────────────
  const commList = commissions ?? [];
  const totalEarnedCents = commList
    .filter((c: Record<string,unknown>) => c.status === "paid")
    .reduce((sum: number, c: Record<string,unknown>) => sum + (c.amount_cents as number ?? 0), 0);
  const pendingCents = commList
    .filter((c: Record<string,unknown>) => ["pending","approved"].includes(c.status as string))
    .reduce((sum: number, c: Record<string,unknown>) => sum + (c.amount_cents as number ?? 0), 0);

  const fmtSGD = (cents: number) =>
    (cents / 100).toLocaleString("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });

  // ── Application counts ─────────────────────────────────────────────────────
  const { data: allAppsData } = studentIds.length > 0
    ? await db
        .from("applications")
        .select("current_stage, status")
        .in("student_id", studentIds)
    : { data: [] };

  const allApps = allAppsData ?? [];
  const activeApps = allApps.filter((a: Record<string,unknown>) =>
    !["rejected","withdrawn","cancelled"].includes(a.current_stage as string ?? a.status as string ?? "")
  ).length;
  const approvedApps = allApps.filter((a: Record<string,unknown>) =>
    ["approved","arrival_preparation","arrived_singapore"].includes(a.current_stage as string ?? "")
  ).length;

  return (
    <div className="space-y-7 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-500/10 via-navy-900/80 to-navy-950 border border-gold-400/20 p-6 md:p-8">
        <div aria-hidden className="absolute top-0 right-0 w-64 h-48 bg-gold-400/[0.08] rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-3 mb-1">
          <Award className="w-4 h-4 text-gold-400" />
          <p className="text-gold-400 font-body text-xs font-semibold tracking-widest uppercase">Recruitment Partner</p>
        </div>
        <h2 className="relative font-display text-4xl text-white mb-1">{partnerName}</h2>
        <p className="relative text-white/45 font-body text-sm">{profile?.email}</p>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "My Students",         value: String(totalStudents ?? 0), icon: Users,     gold: true,  href: "/dashboard/partner/students"    },
          { label: "Active Applications", value: String(activeApps),         icon: FileText,  gold: false, href: "/dashboard/partner/applications" },
          { label: "Students Approved",   value: String(approvedApps),       icon: CheckCircle2, gold: false, href: "/dashboard/partner/applications" },
          { label: "Commissions Pending", value: fmtSGD(pendingCents),       icon: CreditCard, gold: false, href: "/dashboard/partner/commissions"  },
        ].map(({ label, value, icon: Icon, gold, href }) => (
          <Link key={label} href={href}>
            <div className={`relative rounded-2xl border p-5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
              gold ? "bg-gold-400/[0.07] border-gold-400/30" : "bg-white/[0.04] border-white/[0.08]"
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                gold ? "bg-gradient-to-br from-gold-500 to-gold-600" : "bg-white/[0.08] border border-white/10"
              }`}>
                <Icon className={`w-5 h-5 ${gold ? "text-navy-900" : "text-gold-400"}`} strokeWidth={1.75} />
              </div>
              <div className="font-display text-2xl text-white font-bold leading-none mb-1 truncate">{value}</div>
              <p className="text-white/45 font-body text-sm">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Students — 2/3 width */}
        <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">Recent Students</h3>
            <Link href="/dashboard/partner/students" className="text-gold-400 hover:text-gold-300 font-body text-xs font-semibold flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(recentStudentsRaw ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Users className="w-10 h-10 text-white/20 mb-3" />
              <p className="font-display text-xl text-white/40 mb-1">No students yet</p>
              <p className="text-white/30 font-body text-sm">Contact your PathPort manager to link students to your account</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {(recentStudentsRaw ?? []).map((row: Record<string,unknown>) => {
                const s = row.student as Record<string,unknown> | null;
                return (
                  <div key={row.id as string} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 text-navy-900 font-display font-bold text-sm">
                        {(String(s?.full_name ?? "").trim()[0] ?? "U").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-sm text-white/85 truncate">{s?.full_name as string ?? "—"}</p>
                        <p className="font-body text-xs text-white/40 truncate mt-0.5">{s?.email as string ?? "—"}</p>
                      </div>
                    </div>
                    <p className="text-white/30 font-body text-xs flex-shrink-0">
                      {new Date(row.referred_at as string).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Commission summary */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-white">Commissions</h3>
              <Link href="/dashboard/partner/commissions" className="text-gold-400 hover:text-gold-300 font-body text-xs font-semibold transition-colors">
                Details →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/50 font-body text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Paid
                </span>
                <span className="text-white/80 font-body text-sm font-semibold">{fmtSGD(totalEarnedCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 font-body text-sm flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gold-400" /> Pending
                </span>
                <span className="text-white/80 font-body text-sm font-semibold">{fmtSGD(pendingCents)}</span>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-white">Recent Applications</h3>
              <Link href="/dashboard/partner/applications" className="text-gold-400 hover:text-gold-300 font-body text-xs font-semibold transition-colors">
                View all →
              </Link>
            </div>
            {(recentApps ?? []).length === 0 ? (
              <p className="text-white/30 font-body text-sm text-center py-4">No applications yet</p>
            ) : (
              <div className="space-y-2">
                {(recentApps ?? []).slice(0, 3).map((app: Record<string,unknown>) => {
                  const student = app.student as Record<string,unknown> | null;
                  const courses = app.courses as Record<string,unknown> | null;
                  const colleges = courses?.colleges as Record<string,unknown> | null;
                  const stageColors: Record<string, string> = {
                    approved: "text-emerald-400",
                    rejected: "text-red-400",
                    offer_letter_ready: "text-gold-400",
                  };
                  const stage = app.current_stage as string ?? app.status as string ?? "submitted";
                  const color = stageColors[stage] ?? "text-white/50";
                  return (
                    <div key={app.id as string} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="font-body text-sm text-white/80 font-semibold truncate">{student?.full_name as string ?? "—"}</p>
                      <p className="font-body text-xs text-white/40 truncate">{colleges?.name as string ?? "—"}</p>
                      <p className={`font-body text-[11px] font-semibold mt-1 ${color}`}>
                        {stage.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-display text-lg text-white mb-3">Quick Links</h3>
            <div className="space-y-1.5">
              {[
                { icon: Users,     label: "My Students",     href: "/dashboard/partner/students"      },
                { icon: FileText,  label: "Applications",    href: "/dashboard/partner/applications"   },
                { icon: Building2, label: "Institutions",    href: "/dashboard/partner/institutions"   },
                { icon: Bell,      label: "Notifications",   href: "/dashboard/partner/notifications"  },
              ].map(({ icon: Icon, label, href }) => (
                <Link key={href} href={href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group">
                  <Icon className="w-4 h-4 text-gold-400/70 flex-shrink-0" />
                  <span className="font-body text-sm text-white/60 group-hover:text-white/85 transition-colors">{label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 ml-auto transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
