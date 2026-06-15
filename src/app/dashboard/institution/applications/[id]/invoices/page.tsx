import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InvoiceListClient from "@/components/payments/InvoiceListClient";
import type { StudentInvoice, CourseFeeSchedule, Currency } from "@/types/payment";

export const metadata = { title: "Invoices — Institution" };
export const dynamic  = "force-dynamic";

const VALID_CURRENCIES: Currency[] = ["SGD", "USD", "INR", "GBP", "EUR", "AUD"];

export default async function InstitutionApplicationInvoicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: applicationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") redirect("/dashboard");

  // Load application + course context.
  const { data: app } = await supabase
    .from("applications")
    .select("id, public_id, student_id, course_id, courses!inner(id, title, college_id, colleges(name))")
    .eq("id", applicationId)
    .single();
  if (!app) notFound();
  type Row = { id: string; public_id: string | null; student_id: string; course_id: string; courses: { id: string; title: string; college_id: string; colleges: { name: string } | { name: string }[] | null } | { id: string; title: string; college_id: string; colleges: { name: string } | { name: string }[] | null }[] | null };
  const r = app as unknown as Row;
  const course  = Array.isArray(r.courses) ? r.courses[0] : r.courses;
  if (!course) notFound();
  const college = course ? (Array.isArray(course.colleges) ? course.colleges[0] : course.colleges) : null;

  if (profile.role === "institution" && profile.college_id !== course.college_id) {
    redirect("/dashboard/institution/applications");
  }

  const [
    { data: invoicesRaw },
    { data: schedulesRaw },
    { data: paySettings },
    { data: studentProfile },
  ] = await Promise.all([
    supabase.from("student_invoices").select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
    supabase.from("course_fee_schedules").select("*")
      .eq("course_id", course.id)
      .order("is_default", { ascending: false }),
    supabase.from("college_payment_settings").select("bank_currency, wise_currency")
      .eq("college_id", course.college_id)
      .maybeSingle(),
    supabase.from("profiles").select("public_id, full_name, email")
      .eq("id", r.student_id).single(),
  ]);

  const defaultCurrency: Currency = (() => {
    const candidate = paySettings?.bank_currency ?? paySettings?.wise_currency ?? "SGD";
    return VALID_CURRENCIES.includes(candidate as Currency) ? (candidate as Currency) : "SGD";
  })();

  return (
    <div className="max-w-4xl space-y-6">
      <Link href={`/dashboard/institution/applications/${applicationId}`}
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-xs transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Application
      </Link>

      <div className="space-y-1">
        <p className="text-pathBlue-400 font-body text-[11px] font-semibold uppercase tracking-wider">
          {college?.name ?? "Application"} · {r.public_id ?? applicationId.slice(0, 8)}
        </p>
        <h2 className="font-display text-3xl text-white">{course.title}</h2>
        <p className="text-white/45 font-body text-sm">
          Student: <span className="text-white/70">{studentProfile?.full_name ?? "—"}</span>
          {studentProfile?.public_id && <span className="font-mono text-white/35"> · {studentProfile.public_id}</span>}
        </p>
      </div>

      <InvoiceListClient
        applicationId={applicationId}
        invoices={(invoicesRaw ?? []) as StudentInvoice[]}
        feeSchedules={(schedulesRaw ?? []) as CourseFeeSchedule[]}
        defaultCurrency={defaultCurrency}
        detailHrefBase={`/dashboard/institution/invoices`}
      />
    </div>
  );
}
