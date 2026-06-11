import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PartnerApprovalActions from "@/components/admin/PartnerApprovalActions";
import {
  ArrowLeft, Building2, User, Mail, Phone, Globe,
  Calendar, MessageSquare, Award, CheckCircle2, XCircle, Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PartnerApp = {
  id:               string;
  org_name:         string;
  contact_name:     string;
  email:            string;
  phone:            string;
  partner_type:     string;
  country:          string;
  website:          string | null;
  message:          string | null;
  status:           string;
  created_at:       string;
  approved_at:      string | null;
  approved_by:      string | null;
  rejected_at:      string | null;
  rejected_by:      string | null;
  rejection_reason: string | null;
  created_user_id:  string | null;
};

const TYPE_LABELS: Record<string, string> = {
  institution:         "Institution",
  recruitment_partner: "Recruitment Partner",
  employer:            "Employer",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPartnerApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch the application
  const { data: app, error } = await supabase
    .from("partner_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !app) notFound();

  const a = app as PartnerApp;

  // Fetch colleges for institution assignment
  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Fetch approver/rejecter name if present
  const actorId = a.approved_by ?? a.rejected_by;
  let actorName: string | null = null;
  if (actorId) {
    const { data: actorProfile } = await supabase
      .from("profiles").select("full_name").eq("id", actorId).single();
    actorName = actorProfile?.full_name ?? null;
  }

  // Fetch audit log for this application
  const { data: auditRows } = await supabase
    .from("partner_account_audit_log")
    .select("id, action, partner_type, created_at, notes, created_by, profiles:created_by(full_name)")
    .eq("application_id", id)
    .order("created_at", { ascending: false });

  const statusMeta = {
    pending:  { label: "Pending Review", color: "text-gold-400    bg-gold-400/10    border-gold-400/30",    icon: Clock         },
    approved: { label: "Approved",       color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/30", icon: CheckCircle2  },
    rejected: { label: "Rejected",       color: "text-red-400     bg-red-500/10     border-red-400/30",     icon: XCircle       },
  }[a.status] ?? { label: a.status, color: "text-white/50 bg-white/[0.04] border-white/[0.09]", icon: Award };

  const StatusIcon = statusMeta.icon;

  return (
    <div className="max-w-3xl space-y-6">

      {/* Back */}
      <Link
        href="/dashboard/admin/partner-applications"
        className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 font-body text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Applications
      </Link>

      {/* Header card */}
      <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-gold-400" />
              <span className="font-body text-xs text-gold-400 font-semibold tracking-wider uppercase">
                {TYPE_LABELS[a.partner_type] ?? a.partner_type}
              </span>
            </div>
            <h1 className="font-display text-2xl text-white">{a.org_name}</h1>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-body text-xs font-semibold ${statusMeta.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusMeta.label}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: User,          label: "Contact Person", value: a.contact_name },
            { icon: Mail,          label: "Email",          value: a.email        },
            { icon: Phone,         label: "Phone",          value: a.phone        },
            { icon: Building2,     label: "Country",        value: a.country      },
            { icon: Globe,         label: "Website",        value: a.website      },
            { icon: Calendar,      label: "Applied",        value: new Date(a.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }) },
          ].map(({ icon: Icon, label, value }) =>
            value ? (
              <div key={label} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-white/25 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-body text-[11px] text-white/35 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="font-body text-sm text-white/80">
                    {label === "Website"
                      ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-pathBlue-400 hover:underline">{value}</a>
                      : value
                    }
                  </p>
                </div>
              </div>
            ) : null
          )}
        </div>

        {/* Message */}
        {a.message && (
          <div className="mt-5 pt-5 border-t border-white/[0.07]">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-white/25" />
              <p className="font-body text-xs text-white/35 uppercase tracking-wider">Message</p>
            </div>
            <p className="font-body text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{a.message}</p>
          </div>
        )}

        {/* Rejection reason (if rejected) */}
        {a.status === "rejected" && a.rejection_reason && (
          <div className="mt-5 pt-5 border-t border-white/[0.07]">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <p className="font-body text-xs text-red-400/70 uppercase tracking-wider">Rejection Reason</p>
            </div>
            <p className="font-body text-sm text-white/65 leading-relaxed">{a.rejection_reason}</p>
            {actorName && (
              <p className="font-body text-xs text-white/30 mt-1">
                By {actorName} · {a.rejected_at ? new Date(a.rejected_at).toLocaleDateString("en-SG") : "—"}
              </p>
            )}
          </div>
        )}

        {/* Approved by (if approved) */}
        {a.status === "approved" && (
          <div className="mt-5 pt-5 border-t border-white/[0.07]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="font-body text-xs text-emerald-400/70 uppercase tracking-wider">Approval Info</p>
            </div>
            <p className="font-body text-sm text-white/65">
              Approved{actorName ? ` by ${actorName}` : ""}{a.approved_at ? ` on ${new Date(a.approved_at).toLocaleDateString("en-SG")}` : ""}
            </p>
            {a.created_user_id && (
              <p className="font-body text-xs text-white/30 mt-1">Auth user ID: {a.created_user_id}</p>
            )}
          </div>
        )}
      </div>

      {/* Action panel */}
      {a.status === "pending" && (
        <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-6">
          <h2 className="font-display text-lg text-white mb-4">Review Application</h2>
          <PartnerApprovalActions
            applicationId={id}
            partnerType={a.partner_type}
            currentStatus={a.status}
            colleges={(colleges ?? []) as { id: string; name: string }[]}
          />
        </div>
      )}

      {/* Audit log */}
      {(auditRows?.length ?? 0) > 0 && (
        <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.07]">
            <h2 className="font-display text-base text-white">Audit Log</h2>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {(auditRows ?? []).map(row => {
              const r = row as Record<string, unknown>;
              const profRaw = r.profiles as { full_name?: string | null } | { full_name?: string | null }[] | null;
              const prof    = Array.isArray(profRaw) ? profRaw[0] : profRaw;
              return (
                <div key={r.id as string} className="px-6 py-3 flex items-start gap-3">
                  <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    r.action === "approved" ? "bg-emerald-500/20" : "bg-red-500/20"
                  }`}>
                    {r.action === "approved"
                      ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      : <XCircle      className="w-3 h-3 text-red-400"     />
                    }
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-white/75 capitalize">{String(r.action)}</p>
                    {r.notes ? <p className="font-body text-xs text-white/40 mt-0.5 truncate">{String(r.notes)}</p> : null}
                    <p className="font-body text-[11px] text-white/30 mt-0.5">
                      {prof?.full_name ?? "Admin"} · {new Date(r.created_at as string).toLocaleString("en-SG")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
