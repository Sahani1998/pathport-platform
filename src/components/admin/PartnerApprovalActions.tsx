"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, Loader2, Building2, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface College {
  id:   string;
  name: string;
}

interface PartnerApprovalActionsProps {
  applicationId: string;
  partnerType:   string;
  currentStatus: string;
  colleges:      College[];
}

export default function PartnerApprovalActions({
  applicationId,
  partnerType,
  currentStatus,
  colleges,
}: PartnerApprovalActionsProps) {
  const router = useRouter();

  const [action,          setAction]          = useState<"approve" | "reject" | null>(null);
  const [collegeId,       setCollegeId]       = useState<string>("");
  const [newCollegeName,  setNewCollegeName]  = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [done,            setDone]            = useState(false);

  const isInstitution = partnerType === "institution";
  const isTerminal    = currentStatus === "approved" || currentStatus === "rejected";

  if (isTerminal || done) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-2xl border font-body text-sm font-semibold",
        currentStatus === "approved" || done
          ? "bg-emerald-500/10 border-emerald-400/25 text-emerald-400"
          : "bg-red-500/10 border-red-400/25 text-red-400",
      )}>
        {(currentStatus === "approved" || done) ? (
          <><CheckCircle2 className="w-5 h-5" /> Application approved — account created and activation email sent.</>
        ) : (
          <><XCircle className="w-5 h-5" /> Application rejected.</>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);

    if (action === "approve" && isInstitution) {
      if (!collegeId) {
        setError("Please select a college before approving an institution application.");
        return;
      }
      if (collegeId === "new" && !newCollegeName.trim()) {
        setError("Please enter a name for the new college.");
        return;
      }
    }
    if (action === "reject" && !rejectionReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = action === "approve"
        ? `/api/admin/partner-applications/${applicationId}/approve`
        : `/api/admin/partner-applications/${applicationId}/reject`;

      let approveBody: Record<string, string | null> = {};
      if (action === "approve") {
        if (isInstitution && collegeId === "new") {
          approveBody = { new_college_name: newCollegeName.trim() };
        } else {
          approveBody = { college_id: isInstitution ? collegeId : null };
        }
      }
      const body = action === "approve"
        ? approveBody
        : { rejection_reason: rejectionReason.trim() };

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json() as { error?: string };

      if (!res.ok) {
        setError(json.error ?? `Error ${res.status}`);
        return;
      }

      setDone(true);
      // Refresh server-rendered data
      router.refresh();

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Action selector */}
      {!action && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAction("approve")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
          <button
            type="button"
            onClick={() => setAction("reject")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-400/25 text-red-400 font-body text-sm font-semibold hover:bg-red-500/20 transition-all"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      )}

      {/* Approve form */}
      {action === "approve" && (
        <div className="p-5 bg-emerald-500/[0.06] border border-emerald-400/20 rounded-2xl space-y-4">
          <p className="font-body text-sm text-white/70">
            Approving will create a Supabase Auth account and send login credentials to the applicant.
          </p>

          {isInstitution && (
            <div className="space-y-1.5">
              <label className="font-body text-xs text-white/50 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Assign College <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={collegeId}
                  onChange={e => { setCollegeId(e.target.value); setNewCollegeName(""); }}
                  className="w-full appearance-none bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-2.5 font-body text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-all [&>option]:bg-navy-900"
                >
                  <option value="">Select a college…</option>
                  {colleges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="new">+ Add new college</option>
                </select>
                <ChevronDown className="w-4 h-4 text-white/30 absolute right-3 top-3 pointer-events-none" />
              </div>
              {collegeId === "new" && (
                <input
                  type="text"
                  value={newCollegeName}
                  onChange={e => setNewCollegeName(e.target.value)}
                  placeholder="New college name…"
                  className="w-full bg-white/[0.06] border border-emerald-400/30 rounded-xl px-4 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-400/60 transition-all"
                  autoFocus
                />
              )}
              <p className="font-body text-[11px] text-white/30">
                {collegeId === "new"
                  ? "A new college record will be created automatically on approval."
                  : "The institution user will only see applications and documents belonging to this college."
                }
              </p>
            </div>
          )}

          {error && (
            <p className="text-red-400 font-body text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (isInstitution && (!collegeId || (collegeId === "new" && !newCollegeName.trim())))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? "Creating account…" : "Confirm Approval"}
            </button>
            <button
              type="button"
              onClick={() => { setAction(null); setError(null); }}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white/45 font-body text-sm hover:text-white/70 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reject form */}
      {action === "reject" && (
        <div className="p-5 bg-red-500/[0.06] border border-red-400/20 rounded-2xl space-y-4">
          <div className="space-y-1.5">
            <label className="font-body text-xs text-white/50">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explain why the application cannot be approved…"
              rows={3}
              className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-400/50 transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 font-body text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !rejectionReason.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/15 border border-red-400/30 text-red-400 font-body text-sm font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {loading ? "Rejecting…" : "Confirm Rejection"}
            </button>
            <button
              type="button"
              onClick={() => { setAction(null); setError(null); }}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white/45 font-body text-sm hover:text-white/70 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!action && !error && (
        <p className="font-body text-xs text-white/30">
          Approving creates an account and sends login credentials to the applicant.
          Rejecting sends a rejection email. Both actions are irreversible.
        </p>
      )}

      {!action && error && (
        <p className="text-red-400 font-body text-sm">{error}</p>
      )}
    </div>
  );
}
