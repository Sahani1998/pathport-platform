import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText, Briefcase, GraduationCap, Clock, ArrowRight,
  MapPin, CheckCircle2, Circle, Star, Bell, ChevronRight,
  Plane, Building2, BookOpen, Shield, Phone,
} from "lucide-react";
import GoldButton from "@/components/ui/GoldButton";

// ── Mock data ─────────────────────────────────────────────────────────────────

const JOURNEY = [
  { id: 1, label: "Profile Created",        done: true,  active: false },
  { id: 2, label: "Advisor Consultation",   done: true,  active: false },
  { id: 3, label: "College Shortlisted",    done: true,  active: false },
  { id: 4, label: "Application Submitted",  done: false, active: true  },
  { id: 5, label: "Offer Letter",           done: false, active: false },
  { id: 6, label: "Acceptance Confirmed",   done: false, active: false },
  { id: 7, label: "Student Pass (ICA)",     done: false, active: false },
  { id: 8, label: "Arrive in Singapore 🇸🇬", done: false, active: false },
];

const APPLICATIONS = [
  { college: "Dimensions International College",  programme: "Business Management Diploma",     status: "Under Review",  statusColor: "text-gold-400  bg-gold-400/10  border-gold-400/25",  date: "12 Jan 2025" },
  { college: "MDIS",                              programme: "Hospitality & Tourism Diploma",   status: "Shortlisted",   statusColor: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-500/25", date: "08 Jan 2025" },
  { college: "PSB Academy",                       programme: "IT & Computer Science Diploma",   status: "Docs Required", statusColor: "text-orange-400 bg-orange-500/10 border-orange-400/25",  date: "03 Jan 2025" },
];

const DOCS = [
  { name: "10th Marksheet",    uploaded: true  },
  { name: "12th Marksheet",    uploaded: true  },
  { name: "Passport Copy",     uploaded: true  },
  { name: "Passport Photo",    uploaded: false },
  { name: "Bank Statement",    uploaded: false },
  { name: "English Proficiency", uploaded: false },
];

const DEADLINES = [
  { label: "PSB Academy — Doc Deadline",   date: "20 Jan", urgent: true  },
  { label: "MDIS Interview Slot",          date: "25 Jan", urgent: true  },
  { label: "Feb 2025 Intake Closes",       date: "31 Jan", urgent: false },
  { label: "ICA Pre-Assessment",           date: "15 Feb", urgent: false },
];

// ─────────────────────────────────────────────────────────────────────────────

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  // PREVIEW MODE: role guard temporarily disabled so admin can test all dashboards
  // if (profile?.role !== "student") redirect("/dashboard");

  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";
  const docsUploaded = DOCS.filter(d => d.uploaded).length;
  const journeyStep = JOURNEY.findIndex(s => s.active) + 1;

  return (
    <div className="space-y-7 max-w-6xl">

      {/* ── Welcome banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pathBlue-600/20 via-navy-900/60 to-gold-500/10 border border-white/[0.09] p-6 md:p-8">
        {/* decorative orbs */}
        <div aria-hidden className="absolute -top-8 -right-8 w-48 h-48 bg-gold-400/10 rounded-full blur-2xl pointer-events-none" />
        <div aria-hidden className="absolute -bottom-6 left-16 w-32 h-32 bg-pathBlue-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-gold-400/70 font-body text-sm font-semibold tracking-widest uppercase mb-1">Welcome back</p>
            <h2 className="font-display text-4xl md:text-5xl text-white mb-2">
              {firstName} <span className="text-gold-400">👋</span>
            </h2>
            <p className="text-white/50 font-body text-sm">
              Step {journeyStep} of {JOURNEY.length} · Your Singapore journey is underway
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3">
              <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0" />
              <div>
                <p className="text-white/40 font-body text-[10px] uppercase tracking-wider">Destination</p>
                <p className="text-white font-body text-sm font-semibold">Singapore 🇸🇬</p>
              </div>
            </div>
          </div>
        </div>

        {/* Journey progress */}
        <div className="relative mt-6">
          <div className="flex items-center gap-0">
            {JOURNEY.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-body font-bold text-[10px] border-2 transition-all z-10 ${
                  step.done
                    ? "bg-emerald-500 border-emerald-400 text-white"
                    : step.active
                      ? "bg-gold-400 border-gold-300 text-navy-900 ring-4 ring-gold-400/25"
                      : "bg-white/[0.05] border-white/20 text-white/30"
                }`}>
                  {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                </div>
                {i < JOURNEY.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-0.5 ${step.done ? "bg-emerald-500/60" : "bg-white/[0.08]"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex mt-2 gap-0">
            {JOURNEY.map((step) => (
              <div key={step.id} className="flex-1 min-w-0 px-0.5">
                <p className={`font-body text-[9px] leading-tight truncate ${
                  step.active ? "text-gold-400 font-semibold" : step.done ? "text-emerald-400/70" : "text-white/25"
                }`}>{step.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Applications",    value: "3",    icon: FileText,      trend: "active",  gold: true  },
          { label: "Offer Letters",   value: "0",    icon: GraduationCap, trend: "pending", gold: false },
          { label: "Docs Uploaded",   value: `${docsUploaded}/${DOCS.length}`, icon: Shield, trend: "",  gold: false },
          { label: "Days to Intake",  value: "62",   icon: Clock,         trend: "Feb 2025",gold: false },
        ].map(({ label, value, icon: Icon, trend, gold }) => (
          <div key={label} className={`relative rounded-2xl border p-5 hover:-translate-y-0.5 transition-all duration-200 ${
            gold ? "bg-gold-400/[0.07] border-gold-400/30" : "bg-white/[0.04] border-white/[0.08]"
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
              gold ? "bg-gradient-to-br from-gold-500 to-gold-600" : "bg-white/[0.08] border border-white/10"
            }`}>
              <Icon className={`w-5 h-5 ${gold ? "text-navy-900" : "text-gold-400"}`} strokeWidth={1.75} />
            </div>
            <div className="font-display text-3xl text-white font-bold leading-none mb-1">{value}</div>
            <p className="text-white/45 font-body text-sm">{label}</p>
            {trend && <p className="text-white/25 font-body text-[10px] mt-0.5 uppercase tracking-wider">{trend}</p>}
          </div>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Applications table — 2/3 width */}
        <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">My Applications</h3>
            <Link href="/dashboard/student/applications" className="text-gold-400 hover:text-gold-300 font-body text-xs font-semibold flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {APPLICATIONS.map((app) => (
              <div key={app.college} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/25 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-pathBlue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-sm text-white/85 truncate">{app.college}</p>
                    <p className="font-body text-xs text-white/40 truncate mt-0.5">{app.programme}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full border font-body text-[11px] font-semibold ${app.statusColor}`}>
                    {app.status}
                  </span>
                  <p className="text-white/30 font-body text-[10px] mt-1">{app.date}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-white/[0.05]">
            <Link href="/dashboard/student/courses" className="text-pathBlue-400 hover:text-pathBlue-300 font-body text-xs font-semibold flex items-center gap-1 transition-colors">
              <BookOpen className="w-3.5 h-3.5" /> Browse more colleges
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Deadlines */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-gold-400" />
              <h3 className="font-display text-lg text-white">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-2.5">
              {DEADLINES.map((d) => (
                <div key={d.label} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                  d.urgent ? "bg-red-500/[0.06] border-red-500/20" : "bg-white/[0.03] border-white/[0.06]"
                }`}>
                  <p className={`font-body text-xs leading-snug ${d.urgent ? "text-red-300/80" : "text-white/55"}`}>
                    {d.label}
                  </p>
                  <span className={`flex-shrink-0 font-body text-xs font-bold px-2 py-0.5 rounded-lg ${
                    d.urgent ? "text-red-400 bg-red-500/15" : "text-white/40 bg-white/[0.05]"
                  }`}>
                    {d.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-white">Documents</h3>
              <span className="font-body text-xs text-white/40">{docsUploaded}/{DOCS.length}</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.07] rounded-full mb-3">
              <div className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all" style={{ width: `${(docsUploaded / DOCS.length) * 100}%` }} />
            </div>
            <div className="space-y-1.5">
              {DOCS.map((doc) => (
                <div key={doc.name} className="flex items-center gap-2">
                  {doc.uploaded
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                  }
                  <p className={`font-body text-xs ${doc.uploaded ? "text-white/55 line-through" : "text-white/65"}`}>{doc.name}</p>
                </div>
              ))}
            </div>
            <Link href="/dashboard/student/documents" className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gold-400/[0.08] border border-gold-400/25 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/[0.14] transition-all">
              Upload Documents <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Advisor CTA ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-gold-500/[0.10] to-pathBlue-600/[0.08] border border-gold-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(240,165,0,0.06),_transparent_60%)] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-emerald-400 font-body text-xs font-semibold">Advisor Online</p>
          </div>
          <p className="font-display text-xl md:text-2xl text-white">Need help? Your PathPort Advisor is here.</p>
          <p className="text-white/45 font-body text-sm mt-1">Free guidance · WhatsApp response within 24 hours · No obligations</p>
        </div>
        <div className="relative flex gap-3 flex-shrink-0">
          <GoldButton variant="solid-gold" size="md">
            <Phone className="w-4 h-4" /> +65 8377 6492
          </GoldButton>
        </div>
      </div>

    </div>
  );
}
