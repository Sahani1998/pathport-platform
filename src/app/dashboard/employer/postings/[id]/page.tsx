import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { loadStudentProfiles } from "@/lib/student-profiles";
import PostingDetailClient, { type Candidacy } from "./PostingDetailClient";

export const dynamic = "force-dynamic";

export default async function PostingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "employer") redirect("/dashboard");

  const db = createAdminClient();
  const [{ data: posting }, { data: candidacies }] = await Promise.all([
    db.from("postings")
      .select("*, employer_companies(company_name, logo_url)")
      .eq("id", id)
      .eq("employer_id", user.id)
      .maybeSingle(),
    db.from("candidacies")
      .select(`
        id, status, cover_note, resume_url, interview_date, interview_mode,
        interview_location, interview_notes, offer_allowance, offer_currency,
        offer_start_date, offer_response_deadline, rejection_reason,
        employer_notes, applied_at, updated_at, student_id
      `)
      .eq("posting_id", id)
      .order("applied_at", { ascending: false }),
  ]);

  if (!posting) notFound();

  // candidacies.student_id → auth.users (no FK to profiles) — batch-load profiles
  const profileMap = await loadStudentProfiles(db, (candidacies ?? []).map(c => (c as Record<string, unknown>).student_id as string));
  const normCandidacies = (candidacies ?? []).map(c => {
    const raw = c as Record<string, unknown>;
    return { ...raw, student: profileMap.get(raw.student_id as string) ?? null };
  }) as unknown as Candidacy[];

  return <PostingDetailClient posting={posting as Parameters<typeof PostingDetailClient>[0]["posting"]} candidacies={normCandidacies} />;
}
