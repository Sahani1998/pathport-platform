import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import CommissionsClient, { type PartnerCommission } from "./CommissionsClient";

export const dynamic = "force-dynamic";

export default async function PartnerCommissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "recruitment_partner") redirect("/dashboard");

  const db = createAdminClient();

  const { data: rawComm } = await db
    .from("partner_commissions")
    .select(`
      id, amount_cents, currency, status, description, notes,
      paid_at, approved_at, created_at,
      student:profiles!partner_commissions_student_id_fkey ( full_name, email ),
      application:applications!partner_commissions_application_id_fkey (
        public_id, current_stage,
        courses ( title, colleges ( name ) )
      )
    `)
    .eq("partner_id", user.id)
    .order("created_at", { ascending: false });

  const rows: PartnerCommission[] = (rawComm ?? []).map((c: Record<string,unknown>) => {
    const student = c.student as Record<string,unknown> | null;
    const application = c.application as Record<string,unknown> | null;
    const courses = application?.courses as Record<string,unknown> | null;
    const colleges = courses?.colleges as Record<string,unknown> | null;
    return {
      id:           c.id as string,
      amount_cents: c.amount_cents as number,
      currency:     c.currency as string,
      status:       c.status as string,
      description:  c.description as string | null,
      notes:        c.notes as string | null,
      paid_at:      c.paid_at as string | null,
      approved_at:  c.approved_at as string | null,
      created_at:   c.created_at as string,
      student: {
        full_name: student?.full_name as string | null,
        email:     student?.email as string ?? "",
      },
      application: application ? {
        public_id:     application.public_id as string | null,
        current_stage: application.current_stage as string | null,
        course_title:  courses?.title as string | null,
        college_name:  colleges?.name as string | null,
      } : null,
    };
  });

  return <CommissionsClient initialRows={rows} />;
}
