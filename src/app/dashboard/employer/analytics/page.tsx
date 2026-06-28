import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function EmployerAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") redirect("/dashboard");

  const db = createAdminClient();

  // Postings owned by this employer
  const { data: postings } = await db
    .from("postings")
    .select("id, title, status")
    .eq("employer_id", user.id);

  const postingIds = (postings ?? []).map(p => p.id as string);

  const { data: candidacies } = postingIds.length > 0
    ? await db
        .from("candidacies")
        .select("id, posting_id, status, applied_at")
        .in("posting_id", postingIds)
    : { data: [] };

  const rows = candidacies ?? [];

  // ── Funnel: count by stage group ──
  const funnelOrder = [
    { key: "applied",     label: "Applied",     match: ["applied","under_review","shortlisted","interview_scheduled","interview_completed","offer_extended","offer_accepted","hired","started_internship","completed_internship"] },
    { key: "shortlisted", label: "Shortlisted", match: ["shortlisted","interview_scheduled","interview_completed","offer_extended","offer_accepted","hired","started_internship","completed_internship"] },
    { key: "interview",   label: "Interviewed", match: ["interview_completed","offer_extended","offer_accepted","hired","started_internship","completed_internship"] },
    { key: "offer",       label: "Offered",     match: ["offer_extended","offer_accepted","hired","started_internship","completed_internship"] },
    { key: "hired",       label: "Hired",       match: ["hired","started_internship","completed_internship"] },
  ];
  const funnel = funnelOrder.map(f => ({
    stage: f.label,
    count: rows.filter(r => f.match.includes(r.status as string)).length,
  }));

  // ── Applications per posting (top 8) ──
  const perPostingMap: Record<string, number> = {};
  for (const r of rows) {
    const pid = r.posting_id as string;
    perPostingMap[pid] = (perPostingMap[pid] ?? 0) + 1;
  }
  const perPosting = (postings ?? [])
    .map(p => ({ title: (p.title as string).length > 22 ? (p.title as string).slice(0, 20) + "…" : p.title as string, applicants: perPostingMap[p.id as string] ?? 0 }))
    .sort((a, b) => b.applicants - a.applicants)
    .slice(0, 8);

  // ── Applications over last 8 weeks ──
  const now = Date.now();
  const weeks: { week: string; applications: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = now - (i + 1) * 7 * 86400000;
    const end   = now - i * 7 * 86400000;
    const count = rows.filter(r => {
      const t = new Date(r.applied_at as string).getTime();
      return t >= start && t < end;
    }).length;
    weeks.push({ week: `W-${i}`, applications: count });
  }

  // ── Summary metrics ──
  const totalApplicants = rows.length;
  const hired = rows.filter(r => ["hired","started_internship","completed_internship"].includes(r.status as string)).length;
  const conversionRate = totalApplicants > 0 ? Math.round((hired / totalApplicants) * 100) : 0;
  const activePostings = (postings ?? []).filter(p => p.status === "open").length;

  return (
    <AnalyticsClient
      funnel={funnel}
      perPosting={perPosting}
      weekly={weeks}
      summary={{ totalApplicants, hired, conversionRate, activePostings }}
    />
  );
}
