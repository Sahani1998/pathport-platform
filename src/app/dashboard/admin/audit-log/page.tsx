import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ScrollText, ChevronRight, Filter } from "lucide-react";

export const metadata = { title: "Audit Log — Admin" };
export const dynamic  = "force-dynamic";

const PER_PAGE = 25;

// Known audit actions across the codebase. Listed for filter UI.
const ACTIONS = [
  "application_created",
  "stage_changed",
  "stage_advanced_with_skip",
  "withdrawn",
  "document_uploaded",
  "document_approved",
  "document_rejected",
  "document_requested",
  "document_request_cancelled",
  "offer_letter_uploaded",
  "offer_letter_accepted",
  "offer_letter_declined",
  "invoice_issued",
  "invoice_voided",
  "payment_proof_uploaded",
  "payment_verified",
  "payment_rejected",
  "payment_info_requested",
  "official_receipt_issued",
  "ipa_uploaded",
  "ipa_approved",
  "ipa_rejected",
  "note_added",
] as const;

interface AuditRow {
  id:             string;
  application_id: string;
  actor_id:       string | null;
  actor_role:     string | null;
  action:         string;
  from_value:     string | null;
  to_value:       string | null;
  reason:         string | null;
  comments:       string | null;
  metadata:       Record<string, unknown> | null;
  created_at:     string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" });
}

function actionColor(action: string): string {
  if (action.startsWith("payment_") || action === "invoice_issued" || action === "invoice_voided" || action === "official_receipt_issued") return "text-gold-400 bg-gold-400/10 border-gold-400/25";
  if (action.startsWith("document_")) return "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-500/25";
  if (action.startsWith("ipa_"))      return "text-purple-400  bg-purple-500/10  border-purple-400/25";
  if (action.startsWith("offer_"))    return "text-amber-300   bg-amber-400/10   border-amber-400/25";
  if (action === "withdrawn" || action === "stage_changed" || action === "stage_advanced_with_skip" || action === "application_created") return "text-emerald-400 bg-emerald-500/10 border-emerald-400/25";
  return "text-white/60 bg-white/[0.05] border-white/[0.10]";
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // ── Filters from URL ──────────────────────────────────────────────────────
  const action        = (sp.action ?? "").trim();
  const actorQuery    = (sp.actor ?? "").trim();
  const applicationId = (sp.application_id ?? "").trim();
  const fromDate      = (sp.from ?? "").trim();
  const toDate        = (sp.to ?? "").trim();
  const page          = Math.max(1, parseInt(sp.page ?? "1", 10));

  // Resolve actor query (name/email substring) to actor_id list first if provided.
  let actorIds: string[] | null = null;
  if (actorQuery) {
    const { data: matches } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${actorQuery}%,email.ilike.%${actorQuery}%`)
      .limit(50);
    actorIds = (matches ?? []).map(m => m.id);
    if (actorIds.length === 0) {
      // No matching actor — short-circuit with empty result.
      actorIds = ["00000000-0000-0000-0000-000000000000"];
    }
  }

  // ── Build query ───────────────────────────────────────────────────────────
  let q = supabase
    .from("application_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (action)        q = q.eq("action", action);
  if (applicationId) q = q.eq("application_id", applicationId);
  if (actorIds)      q = q.in("actor_id", actorIds);
  if (fromDate)      q = q.gte("created_at", `${fromDate}T00:00:00Z`);
  if (toDate)        q = q.lte("created_at", `${toDate}T23:59:59Z`);

  const from = (page - 1) * PER_PAGE;
  const to   = from + PER_PAGE - 1;
  q = q.range(from, to);

  const { data: rows, count } = await q;
  const auditRows = (rows ?? []) as AuditRow[];

  // ── Hydrate actor names + application public_ids ──────────────────────────
  const uniqueActorIds = Array.from(new Set(auditRows.map(r => r.actor_id).filter(Boolean) as string[]));
  const uniqueAppIds   = Array.from(new Set(auditRows.map(r => r.application_id)));

  const [{ data: actors }, { data: apps }] = await Promise.all([
    uniqueActorIds.length
      ? supabase.from("profiles").select("id, full_name, email").in("id", uniqueActorIds)
      : Promise.resolve({ data: [] }),
    uniqueAppIds.length
      ? supabase.from("applications").select("id, public_id").in("id", uniqueAppIds)
      : Promise.resolve({ data: [] }),
  ]);

  const actorMap = new Map<string, { full_name: string | null; email: string | null }>();
  for (const a of (actors ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
    actorMap.set(a.id, { full_name: a.full_name, email: a.email });
  }
  const appMap = new Map<string, string | null>();
  for (const a of (apps ?? []) as { id: string; public_id: string | null }[]) {
    appMap.set(a.id, a.public_id);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));

  // Build a querystring helper for pagination links that preserves filters.
  const baseQs = new URLSearchParams();
  if (action)        baseQs.set("action", action);
  if (actorQuery)    baseQs.set("actor", actorQuery);
  if (applicationId) baseQs.set("application_id", applicationId);
  if (fromDate)      baseQs.set("from", fromDate);
  if (toDate)        baseQs.set("to", toDate);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl text-white flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-gold-400" /> Audit Log
        </h1>
        <p className="text-white/45 font-body text-sm mt-1">
          Every stage change, document review, payment action, offer-letter decision, withdrawal and IPA event.
        </p>
      </div>

      {/* Filters */}
      <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <div>
          <label className="block text-white/45 font-body text-[10px] uppercase tracking-wider mb-1.5">Action</label>
          <select name="action" defaultValue={action}
            className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white [color-scheme:dark]">
            <option value="" style={{ backgroundColor: "#0a1024" }}>All actions</option>
            {ACTIONS.map(a => (
              <option key={a} value={a} style={{ backgroundColor: "#0a1024" }}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-white/45 font-body text-[10px] uppercase tracking-wider mb-1.5">Actor (name or email)</label>
          <input name="actor" defaultValue={actorQuery} placeholder="e.g. jane@example.com"
            className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold-400/50" />
        </div>
        <div>
          <label className="block text-white/45 font-body text-[10px] uppercase tracking-wider mb-1.5">Application ID (UUID)</label>
          <input name="application_id" defaultValue={applicationId} placeholder="e.g. 5f2a…"
            className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold-400/50 font-mono" />
        </div>
        <div>
          <label className="block text-white/45 font-body text-[10px] uppercase tracking-wider mb-1.5">From</label>
          <input type="date" name="from" defaultValue={fromDate}
            className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white [color-scheme:dark]" />
        </div>
        <div>
          <label className="block text-white/45 font-body text-[10px] uppercase tracking-wider mb-1.5">To</label>
          <input type="date" name="to" defaultValue={toDate}
            className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white [color-scheme:dark]" />
        </div>

        <div className="sm:col-span-2 lg:col-span-5 flex items-center gap-2">
          <button type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all">
            <Filter className="w-4 h-4" /> Apply filters
          </button>
          {(action || actorQuery || applicationId || fromDate || toDate) && (
            <Link href="/dashboard/admin/audit-log"
              className="px-4 py-2 rounded-xl border border-white/[0.10] text-white/55 font-body text-sm hover:text-white hover:border-white/25 transition-all">
              Reset
            </Link>
          )}
          <span className="ml-auto text-white/40 font-body text-xs">
            {count ?? 0} event{(count ?? 0) === 1 ? "" : "s"}
          </span>
        </div>
      </form>

      {/* Results */}
      {auditRows.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-white/30">
          <ScrollText className="w-9 h-9 mb-2" />
          <p className="font-body text-sm">No audit events match these filters</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["When", "Action", "Actor", "Application", "From → To", "Notes"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/35 font-body text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditRows.map(r => {
                  const actor = r.actor_id ? actorMap.get(r.actor_id) : null;
                  const appPublicId = appMap.get(r.application_id);
                  return (
                    <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-body text-xs text-white/55 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold font-mono ${actionColor(r.action)}`}>
                          {r.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-body text-xs text-white/75 truncate">{actor?.full_name ?? "—"}</p>
                          <p className="font-body text-[10px] text-white/35 truncate">{actor?.email ?? r.actor_id ?? "system"}</p>
                          {r.actor_role && (
                            <span className="text-[10px] text-white/35 uppercase tracking-wider">{r.actor_role}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/admin/applications?app=${r.application_id}`}
                          className="font-mono text-xs text-pathBlue-300 hover:text-pathBlue-200">
                          {appPublicId ?? r.application_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-white/55 whitespace-nowrap">
                        {r.from_value || r.to_value ? (
                          <>
                            <span className="text-white/40">{r.from_value ?? "—"}</span>
                            {" → "}
                            <span className="text-white/75">{r.to_value ?? "—"}</span>
                          </>
                        ) : (
                          <span className="text-white/25">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[280px]">
                        {r.reason && (
                          <p className="font-body text-[11px] text-white/55 truncate">
                            <span className="text-white/30">Reason:</span> {r.reason}
                          </p>
                        )}
                        {r.comments && (
                          <p className="font-body text-[11px] text-white/55 truncate">{r.comments}</p>
                        )}
                        {!r.reason && !r.comments && r.metadata && Object.keys(r.metadata).length > 0 && (
                          <p className="font-body text-[10px] text-white/30 truncate font-mono">
                            {Object.keys(r.metadata).slice(0, 3).join(", ")}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/dashboard/admin/audit-log?${new URLSearchParams({ ...Object.fromEntries(baseQs), page: String(page - 1) }).toString()}`}
              className="px-3 py-1.5 rounded-lg border border-white/[0.10] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
              Previous
            </Link>
          )}
          <span className="font-body text-xs text-white/35">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/dashboard/admin/audit-log?${new URLSearchParams({ ...Object.fromEntries(baseQs), page: String(page + 1) }).toString()}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.10] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
              Next <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
