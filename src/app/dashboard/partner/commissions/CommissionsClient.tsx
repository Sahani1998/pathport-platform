"use client";

import { useMemo } from "react";
import { CreditCard, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export interface PartnerCommission {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string | null;
  notes: string | null;
  paid_at: string | null;
  approved_at: string | null;
  created_at: string;
  student: {
    full_name: string | null;
    email: string;
  };
  application: {
    public_id: string | null;
    current_stage: string | null;
    course_title: string | null;
    college_name: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CreditCard }> = {
  pending:   { label: "Pending",   color: "bg-gold-400/15 text-gold-400 border-gold-400/30",       icon: Clock         },
  approved:  { label: "Approved",  color: "bg-pathBlue-500/15 text-pathBlue-400 border-pathBlue-500/30", icon: AlertCircle  },
  paid:      { label: "Paid",      color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",   icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-white/10 text-white/40 border-white/20",              icon: XCircle       },
};

interface Props {
  initialRows: PartnerCommission[];
}

export default function CommissionsClient({ initialRows }: Props) {
  const fmtAmount = (cents: number, currency: string) =>
    (cents / 100).toLocaleString("en-SG", { style: "currency", currency, maximumFractionDigits: 2 });

  const summary = useMemo(() => {
    const paid     = initialRows.filter(r => r.status === "paid").reduce((s, r) => s + r.amount_cents, 0);
    const approved = initialRows.filter(r => r.status === "approved").reduce((s, r) => s + r.amount_cents, 0);
    const pending  = initialRows.filter(r => r.status === "pending").reduce((s, r) => s + r.amount_cents, 0);
    return { paid, approved, pending };
  }, [initialRows]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-gold-400" />
          Commissions
        </h2>
        <p className="text-white/45 font-body text-sm">
          Your commission history and payment status
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Paid",     value: fmtAmount(summary.paid, "SGD"),     color: "text-emerald-400", icon: CheckCircle2 },
          { label: "Approved", value: fmtAmount(summary.approved, "SGD"), color: "text-pathBlue-400", icon: AlertCircle },
          { label: "Pending",  value: fmtAmount(summary.pending, "SGD"),  color: "text-gold-400",    icon: Clock        },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-white/45 font-body text-sm">{label}</p>
            </div>
            <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Commission list */}
      {initialRows.length === 0 ? (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-12 flex flex-col items-center text-center gap-4">
          <CreditCard className="w-10 h-10 text-white/20" />
          <div>
            <p className="font-display text-xl text-white/40 mb-1">No commissions yet</p>
            <p className="text-white/25 font-body text-sm">
              Commissions are created by PathPort when a student you referred is approved
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.07] text-white/30 font-body text-xs uppercase tracking-wider">
            <div className="col-span-3">Student</div>
            <div className="col-span-3">Course / College</div>
            <div className="col-span-2">Description</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Date</div>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {initialRows.map(comm => {
              const cfg = STATUS_CONFIG[comm.status] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={comm.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  {/* Student */}
                  <div className="md:col-span-3 min-w-0">
                    <p className="font-body font-semibold text-sm text-white/85 truncate">{comm.student.full_name ?? "—"}</p>
                    <p className="font-body text-xs text-white/40 truncate">{comm.student.email}</p>
                  </div>
                  {/* Course / College */}
                  <div className="md:col-span-3 min-w-0">
                    <p className="font-body text-sm text-white/70 truncate">{comm.application?.course_title ?? "—"}</p>
                    <p className="font-body text-xs text-white/40 truncate">{comm.application?.college_name ?? "—"}</p>
                    {comm.application?.public_id && (
                      <p className="font-mono text-white/25 text-[10px]">{comm.application.public_id}</p>
                    )}
                  </div>
                  {/* Description */}
                  <div className="md:col-span-2 min-w-0">
                    <p className="font-body text-xs text-white/50 line-clamp-2">{comm.description ?? comm.notes ?? "—"}</p>
                  </div>
                  {/* Amount */}
                  <div className="md:col-span-2 flex md:justify-end items-center">
                    <p className="font-display text-lg font-bold text-white/90">
                      {fmtAmount(comm.amount_cents, comm.currency)}
                    </p>
                  </div>
                  {/* Status */}
                  <div className="md:col-span-1 flex md:justify-center items-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${cfg.color}`}>
                      <Icon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                  </div>
                  {/* Date */}
                  <div className="md:col-span-1 flex md:justify-end items-center">
                    <p className="text-white/30 font-body text-xs">
                      {new Date(comm.paid_at ?? comm.approved_at ?? comm.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info note */}
      <p className="text-white/25 font-body text-xs text-center">
        Commission amounts are set by your PathPort account manager. Contact them for queries.
      </p>
    </div>
  );
}
