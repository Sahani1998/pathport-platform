import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import {
  Users, FileText, TrendingUp, AlertCircle,
  MessageSquare, CheckCircle2, Star, Clock,
} from "lucide-react";

export default async function AdminDashboardPage() {
  console.log("[AdminDashboard] page loaded — start");

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log("[AdminDashboard] getUser — user:", user ? user.id : "null", "| error:", userError?.message ?? "none");

  if (!user) {
    console.log("[AdminDashboard] REDIRECT → /login (no user)");
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  console.log("[AdminDashboard] profile:", profile, "| profileError:", profileError?.message ?? "none");

  if (profile?.role !== "admin") {
    console.log("[AdminDashboard] REDIRECT → /dashboard (role is:", profile?.role ?? "null", ")");
    redirect("/dashboard");
  }

  console.log("[AdminDashboard] role confirmed admin — loading data");

  // ── Registered user counts ───────────────────────────────────────────────
  const [{ count: totalStudents }, { count: totalProfiles }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  // ── Student inquiry counts ────────────────────────────────────────────────
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

  // Log any query errors so they appear in Vercel Runtime Logs
  [e1, e2, e3, e4].forEach((e, i) => {
    if (e) console.error(`[AdminDashboard] inquiry count query #${i + 1} error — code: ${e.code} | msg: ${e.message}`);
  });

  // tableReady: false only when the table literally doesn't exist (42P01).
  // RLS-denied queries return an error too but the table IS there — show 0s
  // not a setup banner.  Permission errors get the real error message below.
  const inquiryError = e1;
  const tableMissing = inquiryError?.code === "42P01";         // undefined_table
  const rlsBlocked   = inquiryError?.code === "42501" ||       // insufficient_privilege
                       inquiryError?.message?.includes("permission") ||
                       inquiryError?.message?.includes("policy");

  // ── 5 most recent inquiries ───────────────────────────────────────────────
  const { data: recentInquiries, error: recentError } = await supabase
    .from("student_inquiries")
    .select("id, full_name, email, country, course_interest, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentError) {
    console.error("[AdminDashboard] recent inquiries error — code:", recentError.code, "| msg:", recentError.message);
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">Admin Dashboard</h2>
          <p className="text-white/45 font-body text-sm">Platform overview and management.</p>
        </div>
        <Link
          href="/dashboard/admin/inquiries"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/[0.08] border border-gold-400/25 text-gold-400 hover:bg-gold-400/[0.14] font-body text-sm font-semibold transition-all"
        >
          View All Inquiries →
        </Link>
      </div>

      {/* ── Inquiry stats ────────────────────────────────────────────────── */}
      <div>
        <p className="text-white/40 font-body text-xs uppercase tracking-widest mb-3">
          Student Inquiries
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Inquiries"  value={totalInquiries  ?? "—"} icon={MessageSquare} gold />
          <StatCard label="New"              value={newInquiries    ?? "—"} icon={Clock}              />
          <StatCard label="Contacted"        value={contactedInquiries ?? "—"} icon={TrendingUp}      />
          <StatCard label="Converted"        value={convertedInquiries ?? "—"} icon={CheckCircle2}    />
        </div>
      </div>

      {/* ── Registered users stats ───────────────────────────────────────── */}
      <div>
        <p className="text-white/40 font-body text-xs uppercase tracking-widest mb-3">
          Registered Users
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Registered Students" value={totalStudents ?? 0} icon={Users}    />
          <StatCard label="Total Accounts"       value={totalProfiles ?? 0} icon={Star}     />
        </div>
      </div>

      {/* ── Recent inquiries table ───────────────────────────────────────── */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h3 className="font-display text-xl text-white">Recent Inquiries</h3>
          <Link href="/dashboard/admin/inquiries" className="text-gold-400 hover:text-gold-300 font-body text-sm transition-colors">
            View all →
          </Link>
        </div>

        {tableMissing ? (
          <div className="flex items-center gap-3 m-4 p-4 rounded-xl bg-gold-400/[0.07] border border-gold-400/25">
            <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0" />
            <p className="text-white/65 font-body text-sm">
              Run <code className="text-gold-300 bg-gold-400/10 px-1.5 py-0.5 rounded text-xs">student_inquiries.sql</code> in Supabase SQL Editor to create the table.
            </p>
          </div>
        ) : rlsBlocked ? (
          <div className="flex items-center gap-3 m-4 p-4 rounded-xl bg-red-500/[0.07] border border-red-500/25">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-white/65 font-body text-sm">
              RLS policy is blocking admin read access. Re-run <code className="text-red-300 bg-red-400/10 px-1.5 py-0.5 rounded text-xs">student_inquiries.sql</code> (updated with SECURITY DEFINER fix).
            </p>
          </div>
        ) : recentInquiries && recentInquiries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Name", "Email", "Country", "Course", "Status", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/35 font-body text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentInquiries.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-body text-sm text-white/80">{row.full_name}</td>
                    <td className="px-4 py-3 font-body text-sm text-white/55">{row.email}</td>
                    <td className="px-4 py-3 font-body text-sm text-white/55">{row.country ?? "—"}</td>
                    <td className="px-4 py-3 font-body text-xs text-white/45 max-w-[140px] truncate">{row.course_interest ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status as string} />
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-white/35">
                      {new Date(row.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-white/25">
            <FileText className="w-10 h-10 mb-3" />
            <p className="font-body text-sm">No inquiries yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

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
