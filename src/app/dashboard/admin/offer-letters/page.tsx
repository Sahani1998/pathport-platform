import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminOfferLettersClient from "@/components/admin/AdminOfferLettersClient";

export const metadata = { title: "Offer Letters — Admin" };

export default async function AdminOfferLettersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch offer letters with application/course/college joins ONLY.
  // applications.student_id references auth.users (not profiles) and
  // offer_letters.uploaded_by references auth.users too, so FK-implicit
  // joins to profiles silently fail.  Profiles fetched separately below.
  const [{ data: letterRows, error: letterErr }, { data: colleges }] = await Promise.all([
    supabase
      .from("offer_letters")
      .select(`
        id, application_id, uploaded_by, file_path, file_name,
        file_size, version, notes, expiry_date, created_at, updated_at,
        applications (
          id, student_id, current_stage,
          courses (id, title, college_id, colleges (id, name))
        )
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("colleges")
      .select("id, name")
      .order("name"),
  ]);

  if (letterErr) console.error("[AdminOfferLetters] fetch error:", letterErr.code, letterErr.message);

  // Audit log — fetch without the profiles join, then enrich.
  const { data: auditRows, error: auditErr } = await supabase
    .from("application_audit_log")
    .select("id, application_id, actor_id, actor_role, action, metadata, created_at")
    .eq("action", "offer_letter_uploaded")
    .order("created_at", { ascending: false })
    .limit(100);

  if (auditErr) console.error("[AdminOfferLetters] audit fetch error:", auditErr.code, auditErr.message);

  // Collect every profile id we need to look up — student (from application),
  // uploader (from offer letter), actor (from audit row) — and resolve in
  // one batched query.
  type AppShape = { student_id?: string | null; [k: string]: unknown };
  type LetterShape = { uploaded_by: string | null; applications: AppShape | AppShape[] | null; [k: string]: unknown };

  const profileIds = new Set<string>();
  for (const r of (letterRows ?? []) as LetterShape[]) {
    if (r.uploaded_by) profileIds.add(r.uploaded_by);
    const app = Array.isArray(r.applications) ? r.applications[0] : r.applications;
    if (app?.student_id) profileIds.add(app.student_id);
  }
  for (const a of auditRows ?? []) {
    if (a.actor_id) profileIds.add(a.actor_id);
  }

  let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (profileIds.size > 0) {
    const { data: pRows, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(profileIds));
    if (pErr) console.error("[AdminOfferLetters] profile fetch error:", pErr.code, pErr.message);
    profileMap = new Map((pRows ?? []).map(p => [p.id, { full_name: p.full_name, email: p.email }]));
  }

  // Enrich letter rows with embedded profile data in the shape the client
  // component already destructures: applications.profiles (student) and
  // top-level profiles (uploader).
  const enrichedLetterRows = ((letterRows ?? []) as LetterShape[]).map(row => {
    const rawApp = Array.isArray(row.applications) ? row.applications[0] : row.applications;
    const student = rawApp?.student_id ? profileMap.get(rawApp.student_id) ?? null : null;
    const uploader = row.uploaded_by ? profileMap.get(row.uploaded_by) ?? null : null;
    return {
      ...row,
      applications: rawApp
        ? { ...rawApp, profiles: student ? { id: rawApp.student_id, ...student } : null }
        : null,
      profiles: uploader ? { full_name: uploader.full_name } : null,
    };
  });

  const enrichedAuditRows = (auditRows ?? []).map(a => {
    const actor = a.actor_id ? profileMap.get(a.actor_id) ?? null : null;
    return { ...a, profiles: actor ? { full_name: actor.full_name } : null };
  });

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Offer Letters</h2>
        <p className="text-white/40 font-body text-sm">
          Search, filter, download, and audit all issued offer letters
        </p>
      </div>
      <AdminOfferLettersClient
        letterRows={enrichedLetterRows as unknown as Parameters<typeof AdminOfferLettersClient>[0]["letterRows"]}
        colleges={colleges ?? []}
        auditRows={enrichedAuditRows as unknown as Parameters<typeof AdminOfferLettersClient>[0]["auditRows"]}
      />
    </div>
  );
}
