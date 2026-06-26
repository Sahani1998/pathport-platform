import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import PostingDetailClient, { type Candidacy } from "./PostingDetailClient";

export const dynamic = "force-dynamic";

export default async function PostingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") redirect("/dashboard");

  const db = createAdminClient();
  const [{ data: posting }, { data: candidacies }] = await Promise.all([
    db.from("internship_postings")
      .select("*, employer_companies(company_name, logo_url)")
      .eq("id", id)
      .eq("employer_id", user.id)
      .maybeSingle(),
    db.from("internship_candidacies")
      .select(`
        id, status, cover_note, resume_url, interview_date,
        interview_notes, offer_allowance_sgd, offer_start_date,
        rejection_reason, employer_notes, applied_at, updated_at,
        student:profiles!internship_candidacies_student_id_fkey(
          id, full_name, email, country
        )
      `)
      .eq("posting_id", id)
      .order("applied_at", { ascending: false }),
  ]);

  if (!posting) notFound();

  // Supabase FK joins return arrays for referenced tables; normalise to single object
  const normCandidacies = (candidacies ?? []).map(c => {
    const raw = c as Record<string, unknown>;
    return {
      ...raw,
      student: Array.isArray(raw.student) ? (raw.student as unknown[])[0] ?? null : raw.student,
    };
  }) as unknown as Candidacy[];

  return <PostingDetailClient posting={posting as Parameters<typeof PostingDetailClient>[0]["posting"]} candidacies={normCandidacies} />;
}
