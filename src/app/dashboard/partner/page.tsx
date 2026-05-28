import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, Briefcase, TrendingUp, Award, Star,
  ArrowRight, ChevronRight, DollarSign, Globe, BarChart2,
  CheckCircle2, Clock,
} from "lucide-react";
import GoldButton from "@/components/ui/GoldButton";

// ── Mock data ─────────────────────────────────────────────────────────────────

const MY_CANDIDATES = [
  { name: "Rahul Verma",      state: "Maharashtra",  course: "Business Mgmt",     status: "Offer Letter",  stage: 5, commission: "S$350" },
  { name: "Sneha Iyer",       state: "Tamil Nadu",   course: "IT Diploma",         status: "Applied",       stage: 3, commission: "—"     },
  { name: "Amit Gupta",       state: "Delhi",        course: "Hospitality",        status: "Enrolled",      stage: 8, commission: "S$450" },
  { name: "Pooja Reddy",      state: "Telangana",    course: "Engineering",        status: "Shortlisted",   stage: 4, commission: "—"     },
  { name: "Karan Malhotra",   state: "Punjab",       course: "Business Mgmt",     status: "Docs Required", stage: 2, commission: "—"     },
];

const COMMISSION_LOG = [
  { student: "Amit Gupta",    month: "Dec 2024", amount: "S$450", status: "Paid",    college: "MDIS" },
  { student: "Neha Singh",    month: "Nov 2024", amount: "S$350", status: "Paid",    college: "Dimensions" },
  { student: "Rohit Sharma",  month: "Oct 2024", amount: "S$350", status: "Paid",    college: "PSB Academy" },
  { student: "Divya Nair",    month: "Sep 2024", amount: "S$450", status: "Pending", college: "MDIS" },
];

const STAGE_LABELS = ["", "Registered", "Docs", "Applied", "Shortlisted", "Offer", "Accepted", "Pass", "Enrolled"];

// ─────────────────────────────────────────────────────────────────────────────

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  // PREVIEW MODE: role guard temporarily disabled so admin can test all dashboards
  // if (profile?.role !== "recruitment_partner") redirect("/dashboard");

  const partnerName = profile?.full_name ?? "Partner";
  const totalCommission = "S$1,600";

  return (
    <div className="space-y-7 max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-500/10 via-navy-900/80 to-navy-950 border border-gold-400/20 p-6 md:p-8">
        <div aria-hidden className="absolute top-0 right-0 w-64 h-48 bg-gold-400/[0.08] rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-gold-400" />
              <p className="text-gold-400 font-body text-xs font-semibold tracking-widest uppercase">Gold Partner</p>
            </div>
            <h2 className="font-display text-4xl text-white mb-1">{partnerName}</h2>
            <p className="text-white/45 font-body text-sm">India Recruitment Network · Active since 2024</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-gold-400/[0.10] border border-gold-400/25 rounded-xl px-5 py-3 text-center">
              <p className="text-white/40 font-body text-[10px] uppercase tracking-wider">Total Earned</p>
              <p className="font-display text-2xl text-gold-400 font-bold">{totalCommission}</p>
            </div>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Candidates",  value: "5",    icon: Users,      gold: true  },
            { label: "Enrolled (Total)",   value: "3",    icon: CheckCircle2, gold: false },
            { label: "Conversion Rate",    value: "60%",  icon: TrendingUp, gold: false },
            { label: "Partner Rating",     value: "4.9",  icon: Star,       gold: false },
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

      {/* ── Commission model ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { tier: "Base Commission",    amount: "S$350", note: "Per enrolled student",        color: "border-white/[0.09] bg-white/[0.04]" },
          { tier: "Premium College",    amount: "S$450", note: "MDIS / PSB Academy / SIM",    color: "border-gold-400/25 bg-gold-400/[0.06]" },
          { tier: "Volume Bonus",       amount: "+S$200", note: "5+ enrollments/quarter",     color: "border-emerald-500/25 bg-emerald-500/[0.05]" },
        ].map(({ tier, amount, note, color }) => (
          <div key={tier} className={`rounded-2xl border p-5 ${color}`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gold-400/70" />
              <p className="font-body text-xs font-semibold text-white/55 uppercase tracking-wider">{tier}</p>
            </div>
            <p className="font-display text-3xl text-gold-400 font-bold mb-1">{amount}</p>
            <p className="font-body text-xs text-white/40">{note}</p>
          </div>
        ))}
      </div>

      {/* ── Candidates pipeline ────────────────────────────────────────────── */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h3 className="font-display text-xl text-white">My Candidates</h3>
          <Link href="/dashboard/partner/candidates" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {MY_CANDIDATES.map((c) => (
            <div key={c.name} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Name + course */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-500/25 to-pathBlue-500/20 border border-white/[0.10] flex items-center justify-center font-display font-bold text-sm text-white/80 flex-shrink-0">
                  {c.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-sm text-white/85">{c.name}</p>
                  <p className="font-body text-xs text-white/35 truncate">{c.state} · {c.course}</p>
                </div>
              </div>

              {/* Mini pipeline */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {[1,2,3,4,5,6,7,8].map((step) => (
                  <div key={step} title={STAGE_LABELS[step]} className={`h-1.5 rounded-full transition-all ${
                    step < c.stage  ? "w-5 bg-gold-400"
                    : step === c.stage ? "w-7 bg-gold-400 ring-2 ring-gold-400/30"
                    : "w-5 bg-white/[0.10]"
                  }`} />
                ))}
              </div>

              {/* Status + commission */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${
                  c.status === "Enrolled"      ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400" :
                  c.status === "Offer Letter"  ? "bg-gold-400/10 border-gold-400/30 text-gold-400" :
                  c.status === "Applied"       ? "bg-pathBlue-500/10 border-pathBlue-500/30 text-pathBlue-400" :
                                                 "bg-white/[0.06] border-white/[0.10] text-white/40"
                }`}>{c.status}</span>
                {c.commission !== "—" && (
                  <span className="font-body text-xs font-bold text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                    {c.commission}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-white/[0.05]">
          <Link href="/dashboard/partner/candidates" className="text-pathBlue-400 font-body text-xs flex items-center gap-1 hover:text-pathBlue-300 transition-colors">
            <Users className="w-3.5 h-3.5" /> Register new candidate
          </Link>
        </div>
      </div>

      {/* ── Commissions log ─────────────────────────────────────────────────── */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h3 className="font-display text-xl text-white">Commission Log</h3>
          <Link href="/dashboard/partner/reports" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
            Full report <BarChart2 className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Student", "College", "Month", "Amount", "Status"].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-white/30 font-body text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMMISSION_LOG.map((row) => (
                <tr key={row.student + row.month} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3.5 font-body font-semibold text-sm text-white/80">{row.student}</td>
                  <td className="px-6 py-3.5 font-body text-sm text-white/45">{row.college}</td>
                  <td className="px-6 py-3.5 font-body text-sm text-white/45">{row.month}</td>
                  <td className="px-6 py-3.5 font-display text-sm font-bold text-gold-400">{row.amount}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${
                      row.status === "Paid"
                        ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400"
                        : "bg-gold-400/10 border-gold-400/30 text-gold-400"
                    }`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Performance + support ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-gold-500/[0.08] to-transparent border border-gold-400/20 rounded-2xl p-6">
          <Globe className="w-6 h-6 text-gold-400 mb-3" />
          <h3 className="font-display text-xl text-white mb-2">Grow Your Network</h3>
          <p className="text-white/50 font-body text-sm leading-relaxed mb-4">
            Refer another recruitment partner and earn a S$200 bonus when they complete their first placement.
          </p>
          <GoldButton variant="outline-gold" size="sm">Refer a Partner</GoldButton>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <Clock className="w-6 h-6 text-pathBlue-400 mb-3" />
          <h3 className="font-display text-xl text-white mb-2">Upcoming Intakes</h3>
          <div className="space-y-2">
            {[
              { intake: "Apr 2026", colleges: "All colleges", seats: "42 seats left", urgent: true  },
              { intake: "Jul 2026", colleges: "All colleges", seats: "Open soon",     urgent: false },
            ].map((i) => (
              <div key={i.intake} className={`flex items-center justify-between p-3 rounded-xl border ${i.urgent ? "border-gold-400/25 bg-gold-400/[0.06]" : "border-white/[0.07] bg-white/[0.03]"}`}>
                <div>
                  <p className={`font-body text-sm font-semibold ${i.urgent ? "text-gold-400" : "text-white/65"}`}>{i.intake}</p>
                  <p className="font-body text-xs text-white/35">{i.colleges}</p>
                </div>
                <span className={`font-body text-xs font-semibold px-2 py-0.5 rounded-lg ${i.urgent ? "text-gold-400 bg-gold-400/15" : "text-white/35 bg-white/[0.05]"}`}>
                  {i.seats}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
