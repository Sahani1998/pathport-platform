import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import {
  Users, FileText, TrendingUp, AlertCircle,
  MessageSquare, CheckCircle2, Star, Clock,
  Activity, ArrowRight, ChevronRight,
  Building2, BookOpen,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, string> = {
    new:            "bg-pathBlue-500/15 text-pathBlue-400 border-pathBlue-500/30",
    contacted:      "bg-gold-400/15 text-gold-400 border-gold-400/30",
    converted:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    not_interested: "bg-white/[0.06] text-white/40 border-white/[0.08]",
  };
  const LABELS: Record<string, string> = {
    new: "New", contacted: "Contacted", converted: "Converted", not_interested: "Not Interested",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border font-body text-xs font-semibold ${MAP[status] ?? MAP.new}`}>
      {LABELS[status] ?? status}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days  = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // ── Live counts ──────────────────────────────────────────────────────────
  const [{ count: totalStudents }, { count: totalProfiles }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  // ── Platform counts (colleges / courses / applications) ────────────────
  const [
    { count: totalColleges },
    { count: totalCourses },
    { count: openCourses },
    { count: totalApplications },
    { count: totalDocuments },
    { count: pendingDocuments },
    { count: offerReadyApps },
    { count: ipaApps },
    { count: approvedApps },
  ] = await Promise.all([
    supabase.from("colleges").select("*",              { count: "exact", head: true }),
    supabase.from("courses").select("*",               { count: "exact", head: true }),
    supabase.from("courses").select("*",               { count: "exact", head: true }).eq("status", "open"),
    supabase.from("applications").select("*",          { count: "exact", head: true }),
    supabase.from("student_documents").select("*",     { count: "exact", head: true }).eq("is_active", true),
    supabase.from("student_documents").select("*",     { count: "exact", head: true }).eq("is_active", true).eq("status", "pending"),
    supabase.from("applications").select("*",          { count: "exact", head: true }).eq("current_stage", "offer_letter_ready"),
    supabase.from("applications").select("*",          { count: "exact", head: true }).eq("current_stage", "ipa_processing"),
    supabase.from("applications").select("*",          { count: "exact", head: true }).eq("current_stage", "approved"),
  ]);

  const [
    { count: totalInquiries,     error: e1 },
    { count: newInquiries,       error: e2 },
    { count: contactedInquiries, error: e3 },
    { count: convertedInquiries, error: e4 },
  ] = await Promise.all([
    supabase.from("student_inquiries").select("*", { count: "exact", head: true }),
    supabase.from("student_inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("student_inquiries").select("*", { count: "exact", head: true }).eq("status", "contacted"),
    supabase.from("student_inquiries").select("*", { count: "exact", head: true }).eq("status", "converted"),
  ]);

  [e1, e2, e3, e4].forEach((e, i) => {
    if (e) console.error(`[AdminDashboard] inquiry count #${i+1} error: ${e.code} | ${e.message}`);
  });

  const inquiryError = e1;
  const tableMissing = inquiryError?.code === "42P01";
  const rlsBlocked   = inquiryError?.code === "42501" || inquiryError?.message?.includes("permission");

  const { data: recentInquiries, error: recentError } = await supabase
    .from("student_inquiries")
    .select("id, full_name, email, country, course_interest, status, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  if (recentError) console.error("[AdminDashboard] recent error:", recentError.code, recentError.message);

  // ── Real activity feed from timeline events ───────────────────────────────
  const { data: recentEvents } = await supabase
    .from("application_timeline_events")
    .select("id, stage, title, created_at, created_by_role")
    .order("created_at", { ascending: false })
    .limit(6);

  const activityItems = (recentEvents ?? []).map(e => ({
    emoji: e.stage === "approved" ? "🎉"
         : e.stage === "offer_letter_ready" ? "📩"
         : e.stage === "documents_verified" ? "✅"
         : e.stage === "ipa_processing"     ? "🪪"
         : e.stage === "arrived_singapore"  ? "🇸🇬"
         : "📋",
    text: e.title,
    time: timeAgo(e.created_at as string),
    color: e.stage === "approved" || e.stage === "documents_verified" || e.stage === "arrived_singapore"
      ? "text-emerald-400"
      : e.stage === "offer_letter_ready" || e.stage === "ipa_processing"
        ? "text-gold-400"
        : "text-pathBlue-400",
  }));

  // ── Compute pipeline percentages from live counts ─────────────────────────
  const total = totalInquiries ?? 0;
  const stages = [
    { label: "New",           count: newInquiries       ?? 0, color: "bg-pathBlue-500" },
    { label: "Contacted",     count: contactedInquiries ?? 0, color: "bg-gold-500"     },
    { label: "Converted",     count: convertedInquiries ?? 0, color: "bg-emerald-500"  },
  ];

  return (
    <div className="space-y-7 max-w-7xl">

      {/* ── Welcome + hero stats ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800/80 via-navy-900/90 to-navy-950 border border-white/[0.08] p-6 md:p-8">
        <div aria-hidden className="absolute -top-10 -right-10 w-64 h-64 bg-gold-400/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div aria-hidden className="absolute bottom-0 left-20 w-48 h-32 bg-pathBlue-500/[0.07] rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-gold-400/70 font-body text-xs font-semibold tracking-widest uppercase mb-1">Admin Console</p>
            <h2 className="font-display text-4xl md:text-5xl text-white">PathPort HQ</h2>
            <p className="text-white/40 font-body text-sm mt-1">India → Singapore · Full platform overview</p>
          </div>
          <Link href="/dashboard/admin/inquiries">
            <div className="flex items-center gap-2 bg-gold-400/[0.08] border border-gold-400/25 rounded-xl px-4 py-2.5 hover:bg-gold-400/[0.14] transition-all cursor-pointer">
              <Activity className="w-4 h-4 text-gold-400" />
              <span className="font-body text-sm font-semibold text-gold-400">Live Inquiries</span>
              <ArrowRight className="w-4 h-4 text-gold-400/60" />
            </div>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Inquiries"     value={totalInquiries  ?? "—"} icon={MessageSquare} gold  trend="all time"  />
          <StatCard label="New / Uncontacted"   value={newInquiries    ?? "—"} icon={Clock}               trend="action needed" />
          <StatCard label="Contacted"           value={contactedInquiries ?? "—"} icon={TrendingUp}        />
          <StatCard label="Converted"           value={convertedInquiries ?? "—"} icon={CheckCircle2}      />
        </div>
      </div>

      {/* ── RLS / setup banners ──────────────────────────────────────────── */}
      {tableMissing && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/65 font-body text-sm">
            Run <code className="text-gold-300 bg-gold-400/10 px-1.5 py-0.5 rounded text-xs">student_inquiries.sql</code> in Supabase SQL Editor to enable inquiry tracking.
          </p>
        </div>
      )}
      {rlsBlocked && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.07] border border-red-500/25">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/65 font-body text-sm">
            RLS is blocking admin reads. Re-run the updated <code className="text-red-300 bg-red-400/10 px-1.5 py-0.5 rounded text-xs">student_inquiries.sql</code> (includes SECURITY DEFINER fix).
          </p>
        </div>
      )}

      {/* ── Main grid: pipeline + activity ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Inquiry pipeline — 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Pipeline visual */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl text-white">Inquiry Pipeline</h3>
              {total > 0 && <span className="font-body text-sm text-white/40">{total} total</span>}
            </div>
            {total === 0 ? (
              <div className="text-center py-6 text-white/25 font-body text-sm">
                No inquiries yet · Forms connected and ready
              </div>
            ) : (
              <div className="space-y-3">
                {stages.map((s) => {
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-body text-xs text-white/55">{s.label}</p>
                        <p className="font-body text-xs font-bold text-white/70">{s.count} <span className="text-white/30 font-normal">({pct}%)</span></p>
                      </div>
                      <div className="h-7 bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.06]">
                        <div className={`h-full ${s.color} rounded-xl flex items-center px-3 transition-all duration-500`} style={{ width: pct > 0 ? `${Math.max(pct, 8)}%` : "0%" }}>
                          {pct > 5 && <span className="font-body text-xs font-bold text-white/90">{pct}%</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent inquiries table */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <h3 className="font-display text-xl text-white">Recent Inquiries</h3>
              <Link href="/dashboard/admin/inquiries" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {!recentInquiries || recentInquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/25">
                <MessageSquare className="w-10 h-10 mb-3" />
                <p className="font-body text-sm">No inquiries yet.</p>
                <p className="font-body text-xs mt-1 text-white/20">Share the homepage to get your first lead</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Name", "Country", "Course", "Status", "Date"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-white/30 font-body text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentInquiries.map((row) => (
                      <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-body font-semibold text-sm text-white/85">{row.full_name}</p>
                          <p className="font-body text-xs text-white/35">{row.email}</p>
                        </td>
                        <td className="px-5 py-3.5 font-body text-sm text-white/55">{row.country ?? "—"}</td>
                        <td className="px-5 py-3.5 font-body text-xs text-white/45 max-w-[140px] truncate">{row.course_interest ?? "—"}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={row.status as string} /></td>
                        <td className="px-5 py-3.5 font-body text-xs text-white/30 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: activity + reg users ─────────────────────────────── */}
        <div className="space-y-4">

          {/* Platform overview */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-display text-xl text-white mb-4">Platform</h3>
            <div className="space-y-2">
              {[
                { label: "Colleges",          value: totalColleges     ?? "—", icon: Building2    },
                { label: "Courses",          value: totalCourses      ?? "—", icon: BookOpen      },
                { label: "Open Courses",     value: openCourses       ?? "—", icon: TrendingUp    },
                { label: "Applications",     value: totalApplications ?? "—", icon: FileText      },
                { label: "Offer Letters",    value: offerReadyApps    ?? "—", icon: FileText      },
                { label: "IPA Processing",   value: ipaApps           ?? "—", icon: Clock         },
                { label: "Approved",         value: approvedApps      ?? "—", icon: CheckCircle2  },
                { label: "Documents",        value: totalDocuments    ?? "—", icon: FileText      },
                { label: "Docs Pending",     value: pendingDocuments  ?? "—", icon: Clock         },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-pathBlue-400" />
                    <span className="font-body text-sm text-white/65">{label}</span>
                  </div>
                  <span className="font-display text-xl text-white font-bold">{value}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/admin/documents" className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gold-400/[0.07] border border-gold-400/20 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/[0.12] transition-all">
              Review Documents →
            </Link>
          </div>

          {/* Registered users */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-display text-xl text-white mb-4">Registered Users</h3>
            <div className="space-y-3">
              {[
                { label: "Registered Students", value: totalStudents ?? 0, icon: Users,  color: "text-pathBlue-400" },
                { label: "Total Accounts",       value: totalProfiles ?? 0, icon: Star,   color: "text-gold-400"    },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="font-body text-sm text-white/65">{label}</span>
                  </div>
                  <span className="font-display text-xl text-white font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed — real timeline events */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-display text-xl text-white mb-4">Recent Activity</h3>
            {activityItems.length === 0 ? (
              <p className="text-white/25 font-body text-sm text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activityItems.map((item: { emoji: string; text: string; time: string; color: string }, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.09] flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">
                      {item.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-body text-xs leading-relaxed ${item.color}`}>{item.text}</p>
                      <p className="font-body text-[10px] text-white/25 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-display text-xl text-white mb-3">Quick Access</h3>
            <div className="space-y-1.5">
              {[
                { label: "All Inquiries",  href: "/dashboard/admin/inquiries",   icon: MessageSquare },
                { label: "All Students",   href: "/dashboard/admin/students",     icon: Users         },
                { label: "Analytics",      href: "/dashboard/admin/analytics",    icon: TrendingUp    },
                { label: "Settings",       href: "/dashboard/admin/settings",     icon: FileText      },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-white/35 group-hover:text-gold-400 transition-colors" />
                    <span className="font-body text-sm text-white/55 group-hover:text-white/80 transition-colors">{label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
