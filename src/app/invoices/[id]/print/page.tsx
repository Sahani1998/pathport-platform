// Universal printable invoice — student, institution, admin all share this
// route; RLS on student_invoices + invoice_line_items decides what they can
// see. Pass ?auto=1 to trigger the browser print dialog on load.
//
// Lives at /invoices/... (outside the /dashboard tree) so the sidebar +
// header chrome don't appear when printing.

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import InvoicePrintable from "@/components/payments/InvoicePrintable";
import type { StudentInvoice, InvoiceLineItem, PaymentAttempt } from "@/types/payment";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({
  params, searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const { id } = await params;
  const { auto } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: invoice }, { data: lines }] = await Promise.all([
    supabase.from("student_invoices").select("*").eq("id", id).maybeSingle(),
    supabase.from("invoice_line_items").select("*").eq("invoice_id", id).order("sort_order"),
  ]);
  if (!invoice) notFound();

  const [{ data: college }, { data: course }, { data: studentProfile }, { data: appRow }, { data: verifiedAttempts }] = await Promise.all([
    supabase.from("colleges").select("name").eq("id", invoice.college_id).single(),
    supabase.from("courses").select("title").eq("id", invoice.course_id).single(),
    supabase.from("profiles").select("public_id, full_name, email").eq("id", invoice.student_id).single(),
    supabase.from("applications").select("public_id").eq("id", invoice.application_id).single(),
    supabase.from("payment_attempts").select("paid_amount_cents").eq("invoice_id", id).eq("status", "verified"),
  ]);

  const amountReceivedCents = ((verifiedAttempts ?? []) as Pick<PaymentAttempt, "paid_amount_cents">[])
    .reduce((sum, a) => sum + (a.paid_amount_cents ?? 0), 0);

  return (
    <InvoicePrintable
      invoice={invoice as StudentInvoice}
      lines={(lines ?? []) as InvoiceLineItem[]}
      collegeName={college?.name ?? "—"}
      courseTitle={course?.title ?? "—"}
      studentName={studentProfile?.full_name ?? "Student"}
      studentEmail={studentProfile?.email ?? ""}
      studentPublicId={studentProfile?.public_id ?? null}
      applicationPublicId={appRow?.public_id ?? null}
      feeType={invoice.fee_type ?? null}
      amountReceivedCents={amountReceivedCents}
      autoPrint={auto === "1"}
    />
  );
}
