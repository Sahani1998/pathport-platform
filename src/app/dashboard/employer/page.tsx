import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, Briefcase, Star, TrendingUp, ChevronRight,
  Clock, CheckCircle2, MapPin, ArrowRight, DollarSign,
} from "lucide-react";
import GoldButton from "@/components/ui/GoldButton";

// ── Mock data ─────────────────────────────────────────────────────────────────

const ACTIVE_INTERNS = [
  {
    name: "Arjun Mehta",     role: "Business Operations Intern", dept: "Operations",
    country: "🇮🇳",           startDate: "Sep 2024",              monthsLeft: 4,
    rating: 4.8,              salary: "S$1,200/mo",
  },
  {
    name: "Priya Sharma",    role: "Digital Marketing Intern",  dept: "Marketing",
    country: "🇮🇳",           startDate: "Oct 2024",             monthsLeft: 5,
    rating: 4.6,              salary: "S$1,000/mo",
  },
  {
    name: "Kavitha Nair",    role: "IT Support Intern",         dept: "Technology",
    country: "🇱🇰",           startDate: "Nov 2024",             monthsLeft: 6,
    rating: 4.9,              salary: "S$1,100/mo",
  },
];

const PENDING_REQUESTS = [
  { dept: "Finance",    role: "Accounts Assistant Intern", budget: "S$900-1,200", status: "Matching",    date: "08 Jan" },
  { dept: "Logistics",  role: "Supply Chain Intern",       budget: "S$1,000-1,400", status: "Under Review", date: "12 Jan" },
];

const HIRE_HISTORY = [
  { name: "Deepak Singh",  role: "IT Intern → Full Hire",          year: "2023", converted: true  },
  { name: "Meera Iyer",    role: "Marketing Intern",                year: "2023", converted: false },
  { name: "Suresh Babu",   role: "Operations Intern → Full Hire",  year: "2022", converted: true  },
  { name: "Ananya Roy",    role: "Finance Intern",                  year: "2022", converted: false },
];

// ─────────────────────────────────────────────────────────────────────────────

export default async function EmployerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "employer") redirect("/dashboard");

  const companyName = profile?.full_name ?? "Your Company";

  return (
    <div className="space-y-7 max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/10 via-navy-900/80 to-navy-950 border border-white/[0.08] p-6 md:p-8">
        <div aria-hidden className="absolute -top-8 -right-8 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-emerald-400/70 font-body text-xs font-semibold tracking-widest uppercase mb-1">Employer Portal</p>
            <h2 className="font-display text-4xl text-white mb-1">{companyName}</h2>
            <p className="text-white/45 font-body text-sm">Singapore · 6+6 Pathway Partner</p>
          </div>
          <GoldButton variant="outline-gold" size="md">
            + Post Intern Request
          </GoldButton>
        </div>
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Interns",    value: "3",   icon: Users,       gold: true  },
            { label: "Total Hired",       value: "7",   icon: Briefcase,   gold: false },
            { label: "Converted to FTE",  value: "2",   icon: TrendingUp,  gold: false },
            { label: "Avg Rating",        value: "4.8", icon: Star,        gold: false },
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

      {/* ── 6+6 Explainer ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-gold-500/[0.08] to-emerald-500/[0.06] border border-gold-400/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <h3 className="font-display text-2xl text-white mb-2">The 6+6 Pathway</h3>
            <p className="text-white/55 font-body text-sm leading-relaxed mb-3">
              Pre-vetted Singapore diploma interns for 6-month placements. The best talent converts to full-time hires.
              PathPort handles all recruitment, vetting, and placement logistics.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: DollarSign, label: "S$800–S$1,500/mo" },
                { icon: MapPin,     label: "Singapore-based" },
                { icon: Clock,      label: "6-month commitment" },
                { icon: CheckCircle2, label: "Pre-screened talent" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.09] rounded-lg px-3 py-1.5">
                  <Icon className="w-3.5 h-3.5 text-gold-400" />
                  <span className="font-body text-xs text-white/65">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 bg-white/[0.05] border border-white/[0.09] rounded-xl p-4 text-center min-w-[140px]">
            <p className="font-display text-4xl text-gold-400 font-bold">29%</p>
            <p className="font-body text-xs text-white/45 mt-1">Intern-to-hire conversion rate</p>
            <p className="font-body text-xs text-emerald-400 mt-2 font-semibold">↑ vs 12% industry avg</p>
          </div>
        </div>
      </div>

      {/* ── Active interns ──────────────────────────────────────────────────── */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h3 className="font-display text-xl text-white">Active Interns</h3>
          <Link href="/dashboard/employer/interns" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {ACTIVE_INTERNS.map((intern) => (
            <div key={intern.name} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-pathBlue-500/30 border border-white/[0.12] flex items-center justify-center font-display font-bold text-white/80 flex-shrink-0">
                  {intern.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-body font-semibold text-sm text-white/85">{intern.name}</p>
                    <span className="text-lg">{intern.country}</span>
                  </div>
                  <p className="font-body text-xs text-white/40">{intern.role} · {intern.dept}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                <div className="text-center">
                  <p className="font-body text-xs text-white/35 uppercase tracking-wider">Since</p>
                  <p className="font-body text-sm font-semibold text-white/70">{intern.startDate}</p>
                </div>
                <div className="text-center">
                  <p className="font-body text-xs text-white/35 uppercase tracking-wider">Remaining</p>
                  <p className="font-body text-sm font-semibold text-white/70">{intern.monthsLeft} mo</p>
                </div>
                <div className="text-center">
                  <p className="font-body text-xs text-white/35 uppercase tracking-wider">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                    <p className="font-body text-sm font-semibold text-gold-400">{intern.rating}</p>
                  </div>
                </div>
                <span className="hidden sm:block px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-xs font-semibold">
                  {intern.salary}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pending requests + history ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">Pending Requests</h3>
            <span className="bg-gold-400/15 border border-gold-400/30 text-gold-400 px-2 py-0.5 rounded-full font-body text-xs font-bold">{PENDING_REQUESTS.length}</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {PENDING_REQUESTS.map((req) => (
              <div key={req.role} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body font-semibold text-sm text-white/85">{req.role}</p>
                    <p className="font-body text-xs text-white/35 mt-0.5">{req.dept} · {req.budget}</p>
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${
                    req.status === "Matching"
                      ? "bg-pathBlue-500/10 border-pathBlue-500/30 text-pathBlue-400"
                      : "bg-gold-400/10 border-gold-400/30 text-gold-400"
                  }`}>{req.status}</span>
                </div>
                <p className="text-white/25 font-body text-[10px] mt-2">Submitted {req.date}</p>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-white/[0.05]">
            <Link href="/dashboard/employer/requests" className="text-gold-400 font-body text-xs flex items-center gap-1 hover:text-gold-300 transition-colors">
              Post new request <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* History */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">Hire History</h3>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {HIRE_HISTORY.map((h) => (
              <div key={h.name + h.year} className="px-6 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.converted ? "bg-emerald-400" : "bg-white/20"}`} />
                  <div>
                    <p className="font-body text-sm text-white/75">{h.name}</p>
                    <p className="font-body text-xs text-white/35">{h.role}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-body text-xs text-white/35">{h.year}</p>
                  {h.converted && <p className="font-body text-[10px] text-emerald-400 font-semibold">Converted ✓</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
