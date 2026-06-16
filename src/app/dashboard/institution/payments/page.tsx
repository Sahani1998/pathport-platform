import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, HelpCircle, ExternalLink } from "lucide-react";
import {
  PAYMENT_ATTEMPT_STATUS_META, INVOICE_STATUS_META,
  type PaymentAttempt, type StudentInvoice,
} from "@/types/payment";
import { formatCents } from "@/lib/payments/invoice-helpers";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { key: "proof_submitted", label: "Awaiting Review",   icon: Clock         },
  { key: "verified",        label: "Verified",          icon: CheckCircle2  },
  { key: "rejected",        label: "Rejected",          icon: XCircle       },
  { key: "info_requested",  label: "Info Requested",    icon: HelpCircle    },
] as const;

type QueueTab = typeof STATUS_TABS[number]["key"];

export default async function InstitutionPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp     = await searchParams;
  const tab    = (STATUS_TABS.find(t => t.key === sp.status)?.key ?? "proof_submitted") as QueueTab;
  const page   = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = 20;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") redirect("/dashboard");

  const from = (page - 1) * perPage;
  const to   = from + perPage - 1;

  const { data: attempts, count } = await supabase
    .from("payment_attempts")
    .select("*", { count: "exact" })
    .eq("status", tab)
    .order("created_at", { ascending: true })
    .range(from, to);

  const attemptList = (attempts ?? []) as PaymentAttempt[];

  // Load related invoices + student profiles in one round trip each
  const invoiceIds = Array.from(new Set(attemptList.map(a => a.invoice_id)));
  const studentIds = Array.from(new Set(attemptList.map(a => a.student_id)));

  const [{ data: invoices }, { data: studentProfiles }] = await Promise.all([
    invoiceIds.length
      ? supabase.from("student_invoices").select("id, public_id, amount_cents, currency, status").in("id", invoiceIds)
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? supabase.from("profiles").select("id, full_name, public_id").in("id", studentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const invoiceMap: Record<string, Pick<StudentInvoice, "id" | "public_id" | "amount_cents" | "currency" | "status">> = {};
  for (const inv of (invoices ?? [])) invoiceMap[(inv as { id: string }).id] = inv as typeof invoiceMap[string];

  const studentMap: Record<string, { full_name: string | null; public_id: string | null }> = {};
  for (const s of (studentProfiles ?? [])) studentMap[(s as { id: string }).id] = s as typeof studentMap[string];

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-white">Payments</h1>
        <p className="text-white/45 font-body text-sm mt-1">Review payment proofs submitted by students.</p>
      </div>

      {/* Status tabs */}
      <nav className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          return (
            <Link key={key} href={`/dashboard/institution/payments?status=${key}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-sm whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gold-400/[0.12] text-gold-300 border border-gold-400/25"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </Link>
          );
        })}
      </nav>

      {/* Count summary */}
      <p className="text-white/40 font-body text-xs">
        {count ?? 0} {tab.replace("_", " ")} attempt{(count ?? 0) !== 1 ? "s" : ""}
      </p>

      {/* Queue list */}
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
            const am      = PAYMENT_ATTEMPT_STATUS_META[att.status as keyof typeof PAYMENT_ATTEMPT_STATUS_META];
            const invMeta = inv ? INVOICE_STATUS_META[inv.status as keyof typeof INVOICE_STATUS_META] : null;
            return (
              <Link key={att.id}
                href={`/dashboard/institution/invoices/${att.invoice_id}`}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/25 hover:bg-gold-400/[0.03] transition-all group">
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
                  <p className="font-body text-xs text-white/45 truncate">
                    {student?.full_name ?? "Student"}
                    {student?.public_id && <span className="font-mono text-white/30 ml-1">{student.public_id}</span>}
                    {" · "}
                    {inv ? formatCents(inv.amount_cents, inv.currency) : "—"}
                    {" · "}
                    {att.payment_method.replace("_", " ")}
                  </p>
                  <p className="font-body text-[10px] text-white/30 mt-0.5">
                    {new Date(att.created_at).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })}
                    {inv?.public_id && <> · Invoice {inv.public_id}</>}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/25 group-hover:text-gold-400 transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/dashboard/institution/payments?status=${tab}&page=${page - 1}`}
              className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
              Previous
            </Link>
          )}
          <span className="font-body text-xs text-white/35">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/dashboard/institution/payments?status=${tab}&page=${page + 1}`}
              className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/55 font-body text-xs hover:text-white hover:border-white/25 transition-all">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
