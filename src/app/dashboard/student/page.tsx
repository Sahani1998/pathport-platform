import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApplicationStageBadge from "@/components/applications/ApplicationStageBadge";
import {
  FileText, GraduationCap, ArrowRight,
  MapPin, CheckCircle2, Building2, BookOpen,
  Shield, Bell, ChevronRight, Upload,
} from "lucide-react";
import GoldButton from "@/components/ui/GoldButton";
import type { ApplicationStage } from "@/types/timeline";
import { TIMELINE_STAGES, getStageMeta } from "@/types/timeline";
import { STATUS_TO_STAGE } from "@/lib/application-stage-mapping";

// ─────────────────────────────────────────────────────────────────────────────

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  // PREVIEW MODE: role guard disabled — admin can preview student dashboard
  // if (profile?.role !== "student") redirect("/dashboard");

  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";

  // ── Real data fetches ─────────────────────────────────────────────────────
  const [{ data: appsRaw }, { data: docsRaw }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("applications")
      .select(`
        id, status, current_stage, submitted_at, stage_updated_at,
        courses ( id, title, slug, category, colleges ( name ) )
      `)
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false }),

    supabase
      .from("student_documents")
      .select("id, status, document_type")
      .eq("student_id", user.id)
      .eq("is_active",  true),

    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  // ── Normalize applications ────────────────────────────────────────────────
  type AppData = {
    id: string;
    status: string;
    current_stage: ApplicationStage | null;
    submitted_at: string;
    courses: { id: string; title: string; slug: string; category: string; colleges: { name: string } | null } | null;
  };

  const apps: AppData[] = (appsRaw ?? []).map(a => {
    const raw        = Array.isArray(a.courses) ? a.courses[0] : a.courses;
    const rawColleges = raw ? (raw as unknown as { colleges?: unknown }).colleges : null;
    const col        = Array.isArray(rawColleges) ? (rawColleges as { name: string }[])[0] : (rawColleges as { name: string } | null | undefined) ?? null;
    return {
      id:            a.id,
      status:        a.status ?? "submitted",
      current_stage: (a.current_stage ?? STATUS_TO_STAGE[a.status ?? "submitted"] ?? "application_submitted") as ApplicationStage,
      submitted_at:  a.submitted_at,
      courses: raw ? {
        id:       (raw as {id:string}).id,
        title:    (raw as {title:string}).title,
        slug:     (raw as {slug:string}).slug,
        category: (raw as {category:string}).category,
        colleges: col as {name:string}|null,
      } : null,
    };
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalApps     = apps.length;
  const approvedApps  = apps.filter(a => ["approved","arrival_preparation","arrived_singapore"].includes(a.current_stage ?? "")).length;
  const offerApps     = apps.filter(a => a.current_stage === "offer_letter_ready").length;

  const docs          = docsRaw ?? [];
  const docsUploaded  = new Set(docs.map(d => d.document_type)).size;
  const docsVerified  = docs.filter(d => d.status === "verified").length;
  const DOCS_REQUIRED = 6;

  // ── Journey progress — single source of truth: TIMELINE_STAGES + getStageMeta
  // Renders the same 12 happy-path stages as the My Applications page so
  // labels and step numbers stay consistent across the app. The currently
  // active stage is the one matching the latest application's current_stage;
  // earlier stages are done, later stages are upcoming. No local rewrites.
  const latestActiveApp = apps.find(a => !["rejected","withdrawn"].includes(a.current_stage ?? ""));
  const currentStage    = latestActiveApp?.current_stage ?? null;
  const currentStep     = currentStage ? getStageMeta(currentStage).step : 0;  // 1..12, or 0 if no app / off-path

  const journey = TIMELINE_STAGES.map(meta => ({
    id:     meta.step,
    label:  meta.label,
    emoji:  meta.emoji,
    done:   currentStep > meta.step,
    active: currentStep === meta.step,
  }));

  const journeyTotal = TIMELINE_STAGES.length;  // 12
  const journeyStep  = currentStep;             // current canonical step (e.g. 10 = Approved)
  const currentStageLabel = currentStage ? getStageMeta(currentStage).label : null;

  return (
    <div className="space-y-7 max-w-6xl">

      {/* ── Welcome banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pathBlue-600/20 via-navy-900/60 to-gold-500/10 border border-white/[0.09] p-6 md:p-8">
        <div aria-hidden className="absolute -top-8 -right-8 w-48 h-48 bg-gold-400/10 rounded-full blur-2xl pointer-events-none" />
        <div aria-hidden className="absolute -bottom-6 left-16 w-32 h-32 bg-pathBlue-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-gold-400/70 font-body text-sm font-semibold tracking-widest uppercase mb-1">Welcome back</p>
            <h2 className="font-display text-4xl md:text-5xl text-white mb-2">
              {firstName} <span className="text-gold-400">👋</span>
            </h2>
            <p className="text-white/50 font-body text-sm">
              {totalApps === 0
                ? "Start your Singapore journey — browse courses and apply"
                : currentStageLabel
                  ? `Step ${journeyStep} of ${journeyTotal} · ${currentStageLabel}`
                  : "Your Singapore journey is underway"}
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

        {/* Journey progress — only show if has applications.
            Renders all 12 canonical TIMELINE_STAGES — same source as the
            My Applications page so labels stay consistent. Horizontal
            scroll on narrow viewports keeps the pip strip readable. */}
        {totalApps > 0 && (
          <div className="relative mt-6 -mx-1 overflow-x-auto pb-1">
            <div className="min-w-[640px]">
              <div className="flex items-center gap-0">
                {journey.map((step, i) => (
                  <div key={step.id} className="flex items-center flex-1 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-body font-bold text-[10px] border-2 transition-all z-10 ${
                      step.done
                        ? "bg-emerald-500 border-emerald-400 text-white"
                        : step.active
                          ? "bg-gold-400 border-gold-300 text-navy-900 ring-4 ring-gold-400/25"
                          : "bg-white/[0.05] border-white/20 text-white/30"
                    }`}>
                      {step.done ? <CheckCircle2 className="w-3 h-3" /> : step.id}
                    </div>
                    {i < journey.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-0.5 ${step.done ? "bg-emerald-500/60" : "bg-white/[0.08]"}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex mt-2 gap-0">
                {journey.map((step) => (
                  <div key={step.id} className="flex-1 min-w-0 px-0.5">
                    <p className={`font-body text-[9px] leading-tight truncate ${
                      step.active ? "text-gold-400 font-semibold" : step.done ? "text-emerald-400/70" : "text-white/25"
                    }`}>{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Applications",  value: String(totalApps),                    icon: FileText,      trend: totalApps > 0 ? "active" : "",      gold: true  },
          { label: "Approved",      value: String(approvedApps),                 icon: GraduationCap, trend: offerApps > 0 ? `${offerApps} offer` : "pending", gold: false },
          { label: "Docs Uploaded", value: `${docsUploaded}/${DOCS_REQUIRED}`,   icon: Shield,        trend: docsVerified > 0 ? `${docsVerified} verified` : "", gold: false },
          { label: "Notifications", value: String(unreadCount ?? 0),             icon: Bell,          trend: "unread",                           gold: false },
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

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Applications list — 2/3 width */}
        <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">My Applications</h3>
            <Link href="/dashboard/student/applications" className="text-gold-400 hover:text-gold-300 font-body text-xs font-semibold flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <BookOpen className="w-10 h-10 text-white/20 mb-3" />
              <p className="font-display text-xl text-white/40 mb-1">No applications yet</p>
              <p className="text-white/30 font-body text-sm mb-5">Browse Singapore diploma courses and apply online</p>
              <Link href="/dashboard/student/courses">
                <GoldButton variant="solid-gold" size="sm">Browse Courses</GoldButton>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {apps.slice(0, 4).map((app) => (
                <div key={app.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/25 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-pathBlue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body font-semibold text-sm text-white/85 truncate">{app.courses?.colleges?.name ?? "—"}</p>
                      <p className="font-body text-xs text-white/40 truncate mt-0.5">{app.courses?.title ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <ApplicationStageBadge stage={app.current_stage ?? "application_submitted"} size="sm" showEmoji={false} />
                    <p className="text-white/30 font-body text-[10px] mt-1">
                      {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-6 py-3 border-t border-white/[0.05]">
            <Link href="/dashboard/student/courses" className="text-pathBlue-400 hover:text-pathBlue-300 font-body text-xs font-semibold flex items-center gap-1 transition-colors">
              <BookOpen className="w-3.5 h-3.5" /> Browse more courses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Document progress */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-white">Documents</h3>
              <Link href="/dashboard/student/documents" className="text-gold-400 hover:text-gold-300 font-body text-xs font-semibold transition-colors">
                Upload →
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-white/50 font-body text-sm">Uploaded</p>
                <p className="text-white/80 font-body text-sm font-semibold">{docsUploaded} / {DOCS_REQUIRED}</p>
              </div>
              <div className="h-2 bg-white/[0.07] rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    docsUploaded >= DOCS_REQUIRED ? "bg-emerald-500" :
                    docsUploaded > 0 ? "bg-gold-500" : "bg-white/20"
                  }`}
                  style={{ width: `${Math.round((docsUploaded / DOCS_REQUIRED) * 100)}%` }}
                />
              </div>
              {docsVerified > 0 && (
                <p className="text-emerald-400 font-body text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {docsVerified} verified
                </p>
              )}
              {docsUploaded < DOCS_REQUIRED && (
                <Link href="/dashboard/student/documents">
                  <div className="flex items-center gap-1.5 mt-2 text-gold-400 hover:text-gold-300 font-body text-xs font-semibold transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload {DOCS_REQUIRED - docsUploaded} more document{DOCS_REQUIRED - docsUploaded !== 1 ? "s" : ""}
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-display text-lg text-white mb-3">Quick Links</h3>
            <div className="space-y-1.5">
              {[
                { icon: BookOpen,  label: "Browse Courses",       href: "/dashboard/student/courses"       },
                { icon: FileText,  label: "My Applications",      href: "/dashboard/student/applications"  },
                { icon: Upload,    label: "Upload Documents",      href: "/dashboard/student/documents"     },
                { icon: Bell,      label: "Notifications",         href: "/dashboard/student/notifications" },
              ].map(({ icon: Icon, label, href }) => (
                <Link key={href} href={href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group">
                  <Icon className="w-4 h-4 text-gold-400/70 flex-shrink-0" />
                  <span className="font-body text-sm text-white/60 group-hover:text-white/85 transition-colors">{label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 ml-auto transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Contact advisor */}
          <div className="bg-gradient-to-br from-pathBlue-600/15 to-transparent border border-pathBlue-500/20 rounded-2xl p-5">
            <p className="font-display text-lg text-white mb-1">Need help?</p>
            <p className="text-white/40 font-body text-xs mb-3">Your PathPort advisor is available on WhatsApp</p>
            <a
              href="https://wa.me/6583776492"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
            >
              💬 WhatsApp +65 8377 6492
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
