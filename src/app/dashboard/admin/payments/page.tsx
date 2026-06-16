import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, HelpCircle, ExternalLink, Building2 } from "lucide-react";
import {
  PAYMENT_ATTEMPT_STATUS_META, INVOICE_STATUS_META,
  type PaymentAttempt, type StudentInvoice,
} from "@/types/payment";
import { formatCents } from "@/lib/payments/invoice-helpers";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { key: "proof_submitted", label: "Awaiting Review", icon: Clock         },
  { key: "verified",        label: "Verified",        icon: CheckCircle2  },
  { key: "rejected",        label: "Rejected",        icon: XCircle       },
  { key: "info_requested",  label: "Info Requested",  icon: HelpCircle    },
] as const;

type QueueTab = typeof STATUS_TABS[number]["key"];

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp      = await searchParams;
  const tab     = (STATUS_TABS.find(t => t.key === sp.status)?.key ?? "proof_submitted") as QueueTab;
  const page    = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = 25;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const from = (page - 1) * perPage;
  const to   = from + perPage - 1;

  // Admin sees all colleges; optional college_id filter via query param
  const collegeFilter = sp.college_id ?? null;

  let query = supabase
    .from("payment_attempts")
    .select("*", { count: "exact" })
    .eq("status", tab)
    .order("created_at", { ascending: true })
    .range(from, to);
  if (collegeFilter) query = query.eq("college_id", collegeFilter);

  const { data: attempts, count } = await query;
  const attemptList = (attempts ?? []) as PaymentAttempt[];

  const invoiceIds = Array.from(new Set(attemptList.map(a => a.invoice_id)));
  const studentIds = Array.from(new Set(attemptList.map(a => a.student_id)));
  const collegeIds = Array.from(new Set(attemptList.map(a => a.college_id)));

  const [{ data: invoices }, { data: studentProfiles }, { data: colleges }] = await Promise.all([
    invoiceIds.length
      ? supabase.from("student_invoices").select("id, public_id, amount_cents, currency, status").in("id", invoiceIds)
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? supabase.from("profiles").select("id, full_name, public_id").in("id", studentIds)
      : Promise.resolve({ data: [] }),
    collegeIds.length
      ? supabase.from("colleges").select("id, name, short_code").in("id", collegeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const invoiceMap: Record<string, Pick<StudentInvoice, "id" | "public_id" | "amount_cents" | "currency" | "status">> = {};
  for (const inv of (invoices ?? [])) invoiceMap[(inv as { id: string }).id] = inv as typeof invoiceMap[string];

  const studentMap: Record<string, { full_name: string | null; public_id: string | null }> = {};
  for (const s of (studentProfiles ?? [])) studentMap[(s as { id: string }).id] = s as typeof studentMap[string];

  const collegeMap: Record<string, { name: string; short_code: string | null }> = {};
  for (const c of (colleges ?? [])) collegeMap[(c as { id: string }).id] = c as typeof collegeMap[string];

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">Payments</h1>
          <p className="text-white/45 font-body text-sm mt-1">Cross-college payment verification queue.</p>
        </div>
        {collegeFilter && (
          <Link href="/dashboard/admin/payments"
            className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
            Clear filter
          </Link>
        )}
      </div>

      {/* Status tabs */}
      <nav className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map(({ key, label, icon: Icon }) => {
          const href = `/dashboard/admin/payments?status=${key}${collegeFilter ? `&college_id=${collegeFilter}` : ""}`;
          return (
            <Link key={key} href={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-sm whitespace-nowrap transition-all ${
                tab === key
                  ? "bg-gold-400/[0.12] text-gold-300 border border-gold-400/25"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </Link>
          );
        })}
      </nav>

      <p className="text-white/40 font-body text-xs">
        {count ?? 0} {tab.replace("_", " ")} attempt{(count ?? 0) !== 1 ? "s" : ""}
        {collegeFilter && collegeMap[collegeFilter] && <> · filtered to {collegeMap[collegeFilter].name}</>}
      </p>

      {attemptList.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-white/30">
          <CheckCircle2 className="w-9 h-9 mb-2" />
          <p className="font-body text-sm">No {tab.replace("_", " ")} attempts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attemptList.map(att => {
            const inv     = invoiceMap[att.invoice_id];
            const student = studentMap[att.student_id];
            const college = collegeMap[att.college_id];
            const am      = PAYMENT_ATTEMPT_STATUS_META[att.status as keyof typeof PAYMENT_ATTEMPT_STATUS_META];
            const invMeta = inv ? INVOICE_STATUS_META[inv.status as keyof typeof INVOICE_STATUS_META] : null;
            return (
              <div key={att.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-mono text-sm text-white/85 font-semibold">{att.payment_reference}</p>
                      <span className={`px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${am.color}`}>
                        {am.label}
                      </span>
                      {invMeta && (
                        <span className={`px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${invMeta.color}`}>
                          {invMeta.label}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-white/45">
                      {student?.full_name ?? "Student"}
                      {student?.public_id && <span className="font-mono text-white/30 ml-1">{student.public_id}</span>}
                      {" · "}
                      {inv ? formatCents(inv.amount_cents, inv.currency) : "—"}
                      {" · "}
                      {att.payment_method.replace("_", " ")}
                    </p>
                    <p className="font-body text-[10px] text-white/30 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <Building2 className="w-3 h-3" />
                      {college ? (
                        <Link href={`/dashboard/admin/payments?status=${tab}&college_id=${att.college_id}`}
                          className="hover:text-gold-400 transition-colors">
                          {college.name}
                          {college.short_code && <span className="font-mono ml-1 text-white/20">{college.short_code}</span>}
                        </Link>
                      ) : "—"}
                      {" · "}
                      {new Date(att.created_at).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })}
                      {inv?.public_id && <> · {inv.public_id}</>}
                    </p>
                  </div>
                  <Link href={`/dashboard/institution/invoices/${att.invoice_id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all flex-shrink-0">
                    <ExternalLink className="w-3 h-3" /> Review
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/dashboard/admin/payments?status=${tab}&page=${page - 1}${collegeFilter ? `&college_id=${collegeFilter}` : ""}`}
              className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
              Previous
            </Link>
          )}
          <span className="font-body text-xs text-white/35">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/dashboard/admin/payments?status=${tab}&page=${page + 1}${collegeFilter ? `&college_id=${collegeFilter}` : ""}`}
              className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
