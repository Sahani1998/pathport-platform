import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, FileText, BookOpen, Users, TrendingUp,
  CheckCircle2, Clock, ChevronRight, Star, BarChart2, Globe,
} from "lucide-react";

// ── Mock data ─────────────────────────────────────────────────────────────────

const INTAKE_PIPELINE = [
  { stage: "Inquiries",    count: 84, pct: 100, color: "bg-pathBlue-500"   },
  { stage: "Applied",      count: 47, pct: 56,  color: "bg-pathBlue-400"   },
  { stage: "Reviewed",     count: 31, pct: 37,  color: "bg-gold-500"       },
  { stage: "Offer Sent",   count: 22, pct: 26,  color: "bg-gold-400"       },
  { stage: "Enrolled",     count: 16, pct: 19,  color: "bg-emerald-500"    },
];

const PROGRAMMES = [
  { name: "Business Management",    enrolled: 42, cap: 60, intake: "Feb 2025", status: "Open"   },
  { name: "IT & Computer Science",  enrolled: 28, cap: 40, intake: "Feb 2025", status: "Open"   },
  { name: "Hospitality & Tourism",  enrolled: 35, cap: 40, intake: "Feb 2025", status: "Almost Full" },
  { name: "Engineering (Mech)",     enrolled: 18, cap: 30, intake: "Jul 2025", status: "Open"   },
];

const RECENT_APPS = [
  { name: "Priya Sharma",    country: "🇮🇳",  programme: "Business Mgmt", status: "Docs Required", date: "Today" },
  { name: "Arjun Mehta",     country: "🇮🇳",  programme: "IT Diploma",     status: "Under Review",  date: "Yesterday" },
  { name: "Sunita Patel",    country: "🇱🇰",  programme: "Hospitality",    status: "Offer Ready",   date: "2 days ago" },
  { name: "Ravi Kumar",      country: "🇳🇵",  programme: "Business Mgmt", status: "Enrolled",      date: "3 days ago" },
];

// ─────────────────────────────────────────────────────────────────────────────

export default async function InstitutionDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  // PREVIEW MODE: role guard temporarily disabled so admin can test all dashboards
  // if (profile?.role !== "institution") redirect("/dashboard");

  const institutionName = profile?.full_name ?? "Your Institution";

  return (
    <div className="space-y-7 max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pathBlue-600/15 via-navy-900/80 to-navy-950 border border-white/[0.08] p-6 md:p-8">
        <div aria-hidden className="absolute top-0 right-0 w-64 h-64 bg-pathBlue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-pathBlue-500/20 border border-pathBlue-500/30 flex items-center justify-center">
              <Building2Icon className="w-4 h-4 text-pathBlue-400" />
            </div>
            <span className="text-pathBlue-400 font-body text-xs font-semibold tracking-wider uppercase">Institution Portal</span>
          </div>
          <h2 className="font-display text-4xl text-white mb-1">{institutionName}</h2>
          <p className="text-white/45 font-body text-sm">Feb 2025 intake is open · 3 programmes accepting applications</p>
        </div>
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Enrolled",        value: "123", icon: GraduationCap, gold: true  },
            { label: "Pending Applications",  value: "31",  icon: FileText,       gold: false },
            { label: "Active Programmes",     value: "4",   icon: BookOpen,       gold: false },
            { label: "Placement Rate",        value: "94%", icon: TrendingUp,     gold: false },
          ].map(({ label, value, icon: Icon, gold }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 ${gold ? "bg-gold-400/[0.10] border-gold-400/30" : "bg-white/[0.05] border-white/[0.09]"}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${gold ? "text-gold-400" : "text-white/40"}`} strokeWidth={2} />
                <p className="text-white/40 font-body text-[10px] uppercase tracking-wider">{label}</p>
              </div>
              <p className={`font-display text-2xl font-bold ${gold ? "text-gold-400" : "text-white"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Intake pipeline + programmes ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Pipeline funnel — 2/5 */}
        <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-gold-400" />
            <h3 className="font-display text-xl text-white">Feb 2025 Pipeline</h3>
          </div>
          <div className="space-y-3">
            {INTAKE_PIPELINE.map((s) => (
              <div key={s.stage}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-body text-xs text-white/60">{s.stage}</p>
                  <p className="font-body text-xs font-bold text-white/80">{s.count}</p>
                </div>
                <div className="h-6 bg-white/[0.05] rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-lg flex items-center px-2 transition-all`}
                    style={{ width: `${s.pct}%` }}
                  >
                    <span className="font-body text-[10px] font-bold text-white/90">{s.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20">
            <p className="text-emerald-400 font-body text-xs font-semibold">Conversion rate: 19% · Above average ↑</p>
          </div>
        </div>

        {/* Programmes — 3/5 */}
        <div className="lg:col-span-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">Programmes</h3>
            <Link href="/dashboard/institution/courses" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {PROGRAMMES.map((p) => {
              const fillPct = Math.round((p.enrolled / p.cap) * 100);
              return (
                <div key={p.name} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="font-body font-semibold text-sm text-white/85">{p.name}</p>
                      <p className="font-body text-xs text-white/35 mt-0.5">Intake: {p.intake}</p>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${
                      p.status === "Almost Full"
                        ? "bg-orange-500/10 border-orange-400/30 text-orange-400"
                        : "bg-emerald-500/10 border-emerald-400/30 text-emerald-400"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/[0.07] rounded-full">
                      <div className={`h-full rounded-full ${fillPct > 80 ? "bg-orange-500" : "bg-pathBlue-500"}`} style={{ width: `${fillPct}%` }} />
                    </div>
                    <p className="text-white/40 font-body text-[11px] flex-shrink-0">{p.enrolled}/{p.cap} seats</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent applications ────────────────────────────────────────────── */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h3 className="font-display text-xl text-white">Recent Applications</h3>
          <Link href="/dashboard/institution/applications" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Student", "Country", "Programme", "Status", "Received"].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-white/30 font-body text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_APPS.map((app) => (
                <tr key={app.name} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3.5 font-body font-semibold text-sm text-white/85">{app.name}</td>
                  <td className="px-6 py-3.5 font-body text-lg">{app.country}</td>
                  <td className="px-6 py-3.5 font-body text-sm text-white/55">{app.programme}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${
                      app.status === "Enrolled"     ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400" :
                      app.status === "Offer Ready"  ? "bg-gold-400/10 border-gold-400/30 text-gold-400" :
                      app.status === "Under Review" ? "bg-pathBlue-500/10 border-pathBlue-500/30 text-pathBlue-400" :
                                                      "bg-orange-500/10 border-orange-400/30 text-orange-400"
                    }`}>{app.status}</span>
                  </td>
                  <td className="px-6 py-3.5 font-body text-xs text-white/35">{app.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Support ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users,        title: "Student Support",  desc: "Help students with documents, visa, and onboarding", href: "/dashboard/institution/students"     },
          { icon: Globe,        title: "Marketing Support", desc: "Get listed across PathPort's India recruitment network", href: "/dashboard/institution/reports" },
          { icon: Star,         title: "Placement Boost",  desc: "95% placement rate — let us fill your last seats",  href: "/dashboard/institution/courses"      },
        ].map(({ icon: Icon, title, desc, href }) => (
          <Link key={title} href={href} className="group p-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all">
            <div className="w-9 h-9 rounded-xl bg-gold-400/[0.08] border border-gold-400/20 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-gold-400" />
            </div>
            <p className="font-body font-semibold text-sm text-white/80 group-hover:text-white mb-1">{title}</p>
            <p className="font-body text-xs text-white/35 leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}

function Building2Icon({ className }: { className?: string }) {
  return <GraduationCap className={className} />;
}
