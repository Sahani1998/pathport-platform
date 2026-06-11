import { createClient } from "@/lib/supabase/server";
import { redirect }      from "next/navigation";
import Link              from "next/link";
import {
  Award, Users, CheckCircle2, XCircle, Clock,
  Building2, Briefcase, GraduationCap, Filter, AlertCircle,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PartnerApp = {
  id:           string;
  org_name:     string;
  contact_name: string;
  email:        string;
  phone:        string;
  partner_type: string;
  country:      string;
  status:       string;
  created_at:   string;
  approved_at:  string | null;
  rejected_at:  string | null;
};

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  institution:         { label: "Institution",         icon: GraduationCap, color: "text-pathBlue-400" },
  recruitment_partner: { label: "Recruitment Partner", icon: Users,         color: "text-gold-400"     },
  employer:            { label: "Employer",            icon: Briefcase,     color: "text-purple-400"   },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: "text-gold-400    bg-gold-400/10    border-gold-400/30"    },
  approved: { label: "Approved", color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/30" },
  rejected: { label: "Rejected", color: "text-red-400     bg-red-500/10     border-red-400/30"     },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPartnerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp      = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const filterType   = sp.type   ?? "all";
  const filterStatus = sp.status ?? "all";

  // ── Fetch all applications ─────────────────────────────────────────────
  let query = supabase
    .from("partner_applications")
    .select("id, org_name, contact_name, email, phone, partner_type, country, status, created_at, approved_at, rejected_at")
    .order("created_at", { ascending: false });

  if (filterType   !== "all") query = query.eq("partner_type", filterType);
  if (filterStatus !== "all") query = query.eq("status", filterStatus);

  const { data: apps, error } = await query;
  const rows = (apps ?? []) as PartnerApp[];

  // ── Stats (always from full dataset) ──────────────────────────────────
  const { data: allApps } = await supabase
    .from("partner_applications")
    .select("status, partner_type");

  const all   = allApps ?? [];
  const stats = {
    total:       all.length,
    pending:     all.filter(a => a.status === "pending").length,
    approved:    all.filter(a => a.status === "approved").length,
    rejected:    all.filter(a => a.status === "rejected").length,
    institution: all.filter(a => a.partner_type === "institution").length,
    recruitment: all.filter(a => a.partner_type === "recruitment_partner").length,
    employer:    all.filter(a => a.partner_type === "employer").length,
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Partner Applications</h1>
          <p className="text-white/40 font-body text-sm">
            Approve institutions, recruitment partners, and employers to join PathPort.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.07] border border-red-400/25">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 font-body text-sm">{error.message}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "total",    label: "Total",    icon: Award,         value: stats.total,    accent: "text-white/70"       },
          { key: "pending",  label: "Pending",  icon: Clock,         value: stats.pending,  accent: "text-gold-400"       },
          { key: "approved", label: "Approved", icon: CheckCircle2,  value: stats.approved, accent: "text-emerald-400"    },
          { key: "rejected", label: "Rejected", icon: XCircle,       value: stats.rejected, accent: "text-red-400"        },
        ].map(({ key, label, icon: Icon, value, accent }) => (
          <div key={key} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${accent}`} />
              <span className="font-body text-xs text-white/40">{label}</span>
            </div>
            <p className={`font-display text-3xl font-bold ${accent}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { type: "institution",         label: "Institutions",         icon: GraduationCap, count: stats.institution, color: "text-pathBlue-400" },
          { type: "recruitment_partner", label: "Recruitment Partners", icon: Users,         count: stats.recruitment, color: "text-gold-400"     },
          { type: "employer",            label: "Employers",            icon: Briefcase,     count: stats.employer,    color: "text-purple-400"   },
        ].map(({ type, label, icon: Icon, count, color }) => (
          <a
            key={type}
            href={`?type=${type}`}
            className={`block p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              filterType === type
                ? "bg-white/[0.07] border-white/20"
                : "bg-white/[0.03] border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className={`font-body text-xs ${color}`}>{label}</span>
            </div>
            <p className="font-display text-2xl font-bold text-white">{count}</p>
          </a>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-white/40">
          <Filter className="w-4 h-4" />
          <span className="font-body text-sm">Filter:</span>
        </div>

        {/* Status filter */}
        {(["all", "pending", "approved", "rejected"] as const).map(s => (
          <a
            key={s}
            href={`?${new URLSearchParams({ ...(filterType !== "all" ? { type: filterType } : {}), status: s }).toString()}`}
            className={`px-3 py-1.5 rounded-full border font-body text-xs font-medium transition-all ${
              filterStatus === s
                ? "bg-white/10 border-white/25 text-white"
                : "bg-white/[0.03] border-white/[0.08] text-white/45 hover:border-white/20 hover:text-white/70"
            }`}
          >
            {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}

        {(filterType !== "all" || filterStatus !== "all") && (
          <a href="?" className="px-3 py-1.5 rounded-full border border-white/[0.08] text-white/35 font-body text-xs hover:text-white/60 transition-all">
            Clear filters
          </a>
        )}
      </div>

      {/* Table / empty state */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
          <div className="w-16 h-16 rounded-2xl bg-gold-400/[0.08] border border-gold-400/20 flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-gold-400" />
          </div>
          <p className="font-display text-xl text-white/40 mb-1">No applications found</p>
          <p className="text-white/25 font-body text-sm">
            {filterType !== "all" || filterStatus !== "all"
              ? "No applications match the current filters."
              : "Partner applications from the homepage will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Organisation", "Contact", "Partner Type", "Country", "Status", "Submitted", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-white/30 font-body text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(p => {
                  const typeMeta   = TYPE_META[p.partner_type]   ?? { label: p.partner_type, icon: Building2, color: "text-white/50" };
                  const statusMeta = STATUS_META[p.status]       ?? STATUS_META.pending;
                  const TypeIcon   = typeMeta.icon;

                  return (
                    <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-body text-sm text-white/85 font-semibold">{p.org_name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-body text-xs text-white/65">{p.contact_name}</p>
                        <p className="font-body text-xs text-white/35">{p.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`flex items-center gap-1.5 font-body text-xs ${typeMeta.color}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeMeta.label}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-body text-xs text-white/55">{p.country}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-body text-xs text-white/35 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/admin/partner-applications/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-400 font-body text-xs font-semibold hover:bg-pathBlue-500/20 transition-all whitespace-nowrap"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-white/[0.05]">
            <p className="font-body text-xs text-white/30">
              Showing {rows.length} application{rows.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
