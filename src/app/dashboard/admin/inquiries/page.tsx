"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { StudentInquiry, InquiryStatus } from "@/types";
import {
  Search, RefreshCw, Clock, CheckCircle2,
  TrendingUp, XCircle, AlertCircle, Loader2,
} from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_META: Record<InquiryStatus, { label: string; color: string }> = {
  new:            { label: "New",           color: "bg-pathBlue-500/15 text-pathBlue-400 border-pathBlue-500/30"   },
  contacted:      { label: "Contacted",     color: "bg-gold-400/15 text-gold-400 border-gold-400/30"               },
  converted:      { label: "Converted",     color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"      },
  not_interested: { label: "Not Interested",color: "bg-white/[0.06] text-white/40 border-white/[0.08]"             },
};

const FILTER_TABS = [
  { value: "all"            as const, label: "All"            },
  { value: "new"            as const, label: "New"            },
  { value: "contacted"      as const, label: "Contacted"      },
  { value: "converted"      as const, label: "Converted"      },
  { value: "not_interested" as const, label: "Not Interested" },
];

type FilterTab = "all" | InquiryStatus;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminInquiriesPage() {
  const [inquiries,    setInquiries]    = useState<StudentInquiry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterTab>("all");
  const [updating,     setUpdating]     = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      console.log("[Inquiries] querying public.student_inquiries…");

      const { data, error: fetchError } = await supabase
        .from("student_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      console.log(
        "[Inquiries] result — rows:", data?.length ?? 0,
        "| error code:", fetchError?.code ?? "none",
        "| error msg:", fetchError?.message ?? "none"
      );

      if (fetchError) {
        if (fetchError.code === "42P01") {
          setError("Table not found. Run student_inquiries.sql in Supabase SQL Editor.");
        } else if (
          fetchError.code === "42501" ||
          fetchError.message?.includes("permission") ||
          fetchError.message?.includes("policy") ||
          fetchError.message?.includes("JWT")
        ) {
          setError(
            `Permission denied (${fetchError.code}). Re-run student_inquiries.sql — ` +
            "it now includes a SECURITY DEFINER function that fixes admin RLS access."
          );
        } else {
          setError(`Query failed: ${fetchError.message} (${fetchError.code})`);
        }
      } else {
        setInquiries((data ?? []) as StudentInquiry[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Inquiries] unexpected exception:", msg);
      setError(`Unexpected error: ${msg}`);
    } finally {
      // Always clears loading — even if await throws, network hangs,
      // or an exception bypasses every other code path.
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  // ── Status update ──────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: InquiryStatus) => {
    setUpdating(id);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("student_inquiries")
        .update({ status })
        .eq("id", id);

      if (updateError) {
        console.error("[Inquiries] updateStatus error:", updateError.message);
      } else {
        setInquiries(prev =>
          prev.map(inq => inq.id === id ? { ...inq, status } : inq)
        );
      }
    } catch (err: unknown) {
      console.error("[Inquiries] updateStatus exception:", err instanceof Error ? err.message : err);
    } finally {
      setUpdating(null);
    }
  };

  // ── Filtered results ───────────────────────────────────────────────────────
  const filtered = inquiries.filter(inq => {
    const matchesStatus = statusFilter === "all" || inq.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      inq.full_name.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      (inq.whatsapp_number ?? "").includes(q) ||
      (inq.city ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // ── Counts per status ──────────────────────────────────────────────────────
  const counts = inquiries.reduce<Record<string, number>>((acc, inq) => {
    acc[inq.status] = (acc[inq.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">Student Inquiries</h2>
          <p className="text-white/45 font-body text-sm">
            {inquiries.length} total · newest first
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 hover:text-white/80 hover:border-white/20 font-body text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── Error state ─────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white/75 font-body text-sm font-semibold mb-1">Table not set up</p>
            <p className="text-white/50 font-body text-sm">{error}</p>
            <p className="text-white/40 font-body text-xs mt-2">
              File: <code className="text-gold-300">src/lib/supabase/student_inquiries.sql</code>
            </p>
          </div>
        </div>
      )}

      {/* ── Status summary pills ─────────────────────────────────────── */}
      {!error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["new", "contacted", "converted", "not_interested"] as InquiryStatus[]).map(s => {
            const meta = STATUS_META[s];
            const icons = { new: Clock, contacted: TrendingUp, converted: CheckCircle2, not_interested: XCircle };
            const Icon = icons[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all",
                  statusFilter === s
                    ? `${meta.color} shadow-sm`
                    : "bg-white/[0.03] border-white/[0.07] hover:border-white/15"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-display text-xl font-bold leading-none">{counts[s] ?? 0}</p>
                  <p className="font-body text-xs mt-0.5 truncate opacity-70">{meta.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Controls ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, email, phone, city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl pl-10 pr-4 py-3 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-all"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "px-3.5 py-2 rounded-xl font-body text-xs font-medium transition-all",
                statusFilter === tab.value
                  ? "bg-gold-400/20 border border-gold-400/40 text-gold-300"
                  : "bg-white/[0.04] border border-white/[0.08] text-white/45 hover:text-white/70 hover:border-white/18"
              )}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="ml-1.5 opacity-60">
                  {counts[tab.value] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-white/35">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-body text-sm">Loading inquiries…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/25">
            <Search className="w-10 h-10 mb-3" />
            <p className="font-body text-sm">No inquiries match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Name & Contact", "Location", "Course / Intake", "Budget", "Status", "Received", "Update Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-white/30 font-body text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inq) => (
                  <tr
                    key={inq.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Name + email + phone */}
                    <td className="px-4 py-4">
                      <p className="font-body font-semibold text-sm text-white/90">{inq.full_name}</p>
                      <p className="font-body text-xs text-white/45 mt-0.5">{inq.email}</p>
                      {inq.whatsapp_number && (
                        <p className="font-body text-xs text-pathBlue-400/70 mt-0.5">
                          {inq.whatsapp_number}
                        </p>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4">
                      <p className="font-body text-sm text-white/65">{inq.country ?? "—"}</p>
                      {inq.indian_state && (
                        <p className="font-body text-xs text-white/35 mt-0.5">{inq.indian_state}</p>
                      )}
                      {inq.city && (
                        <p className="font-body text-xs text-white/35">{inq.city}</p>
                      )}
                    </td>

                    {/* Course + intake */}
                    <td className="px-4 py-4 max-w-[160px]">
                      <p className="font-body text-xs text-white/65 leading-snug">{inq.course_interest ?? "—"}</p>
                      {inq.intended_intake && (
                        <p className="font-body text-xs text-white/35 mt-1">{inq.intended_intake}</p>
                      )}
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-4">
                      <p className="font-body text-xs text-white/45 whitespace-nowrap">
                        {inq.budget_range ?? "—"}
                      </p>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full border font-body text-xs font-semibold whitespace-nowrap",
                        STATUS_META[inq.status].color
                      )}>
                        {STATUS_META[inq.status].label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-body text-xs text-white/40">
                        {new Date(inq.created_at).toLocaleDateString("en-SG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                      <p className="font-body text-xs text-white/25 mt-0.5">
                        {new Date(inq.created_at).toLocaleTimeString("en-SG", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </td>

                    {/* Status update dropdown */}
                    <td className="px-4 py-4">
                      {updating === inq.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                      ) : (
                        <select
                          value={inq.status}
                          onChange={e => updateStatus(inq.id, e.target.value as InquiryStatus)}
                          className="bg-white/[0.06] border border-white/[0.10] rounded-lg px-2.5 py-1.5 font-body text-xs text-white/75 focus:outline-none focus:border-gold-400/50 cursor-pointer appearance-none [&>option]:bg-[#0D1530]"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="not_interested">Not Interested</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer row */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-white/[0.06] text-white/28 font-body text-xs">
            Showing {filtered.length} of {inquiries.length} inquiries
          </div>
        )}
      </div>

    </div>
  );
}
