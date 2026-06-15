import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FeeScheduleEditor from "@/components/payments/FeeScheduleEditor";
import type { CourseFeeSchedule, Currency } from "@/types/payment";

export const metadata = { title: "Fee Schedules — Institution" };
export const dynamic  = "force-dynamic";

const VALID_CURRENCIES: Currency[] = ["SGD", "USD", "INR", "GBP", "EUR", "AUD"];

export default async function CourseFeeSchedulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") redirect("/dashboard");

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, college_id, tuition_fee")
    .eq("id", courseId)
    .single();
  if (!course) notFound();

  // Ownership: institution can only manage schedules for their own college's courses.
  if (profile.role === "institution" && course.college_id !== profile.college_id) {
    redirect("/dashboard/institution/courses");
  }

  const [{ data: schedulesRaw }, { data: paySettings }] = await Promise.all([
    supabase
      .from("course_fee_schedules")
      .select("*")
      .eq("course_id", courseId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("college_payment_settings")
      .select("bank_currency, wise_currency")
      .eq("college_id", course.college_id)
      .maybeSingle(),
  ]);

  const currencyDefault: Currency = ((): Currency => {
    const candidate = paySettings?.bank_currency ?? paySettings?.wise_currency ?? "SGD";
    return VALID_CURRENCIES.includes(candidate as Currency) ? (candidate as Currency) : "SGD";
  })();

  return (
    <div className="max-w-5xl">
      <Link href="/dashboard/institution/courses"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-xs mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
      </Link>

      <FeeScheduleEditor
        courseId={courseId}
        courseTitle={course.title}
        schedules={(schedulesRaw ?? []) as CourseFeeSchedule[]}
        currencyDefault={currencyDefault}
      />
    </div>
  );
}
