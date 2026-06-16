// /receipts/[id]/print — Official receipt print/PDF page.
// Outside the /dashboard/ tree so no sidebar layout is inherited.
// ?auto=1 triggers window.print() via useEffect.

import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { OfficialReceipt, StudentInvoice, PaymentAttempt } from "@/types/payment";
import { formatCents } from "@/lib/payments/invoice-helpers";
import type { Currency } from "@/types/payment";
import ReceiptPrintable from "@/components/payments/ReceiptPrintable";

export const dynamic = "force-dynamic";

export default async function ReceiptPrintPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const sp      = await searchParams;
  const autoPrint = sp.auto === "1";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminDb = createAdminClient();

  const { data: receipt } = await adminDb
    .from("official_receipts").select("*").eq("id", id).maybeSingle();
  if (!receipt) notFound();

  const r = receipt as OfficialReceipt;

  const { data: invoice } = await adminDb
    .from("student_invoices").select("*").eq("id", r.invoice_id).maybeSingle();
  if (!invoice) notFound();

  const inv = invoice as StudentInvoice;

  // Authorization: student must be the invoice owner; institution must match college; admin ok
  const { data: profile } = await adminDb
    .from("profiles").select("role, college_id").eq("id", user.id).maybeSingle();
  const role = profile?.role;
  if (role === "student"     && inv.student_id !== user.id)            redirect("/login");
  if (role === "institution" && inv.college_id !== profile?.college_id) redirect("/login");
  if (!["student", "institution", "admin"].includes(role ?? ""))        redirect("/login");

  const [
    { data: attempt },
    { data: studentProfile },
    { data: college },
    { data: course },
  ] = await Promise.all([
    adminDb.from("payment_attempts").select("payment_reference, payment_method, payment_date").eq("id", r.payment_attempt_id).maybeSingle(),
    adminDb.from("profiles").select("full_name, email").eq("id", inv.student_id).maybeSingle(),
    adminDb.from("colleges").select("name, short_code").eq("id", inv.college_id).maybeSingle(),
    adminDb.from("courses").select("title").eq("id", inv.course_id).maybeSingle(),
  ]);

  const pa = attempt as Pick<PaymentAttempt, "payment_reference" | "payment_method" | "payment_date"> | null;

  return (
    <ReceiptPrintable
      receipt={r}
      invoice={inv}
      studentName={(studentProfile as { full_name: string | null } | null)?.full_name ?? "Student"}
      studentEmail={(studentProfile as { email: string } | null)?.email ?? ""}
      collegeName={(college as { name: string } | null)?.name ?? ""}
      collegeShortCode={(college as { name: string; short_code: string | null } | null)?.short_code ?? ""}
      courseName={(course as { title: string } | null)?.title ?? ""}
      paymentReference={pa?.payment_reference ?? ""}
      paymentMethod={pa?.payment_method ?? ""}
      paymentDate={pa?.payment_date ?? null}
      amountFormatted={formatCents(r.amount_cents, r.currency as Currency)}
      autoPrint={autoPrint}
    />
  );
}
