import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/application-timeline";

const VALID_TRANSITIONS: Record<string, string[]> = {
  applied:             ["shortlisted","rejected"],
  shortlisted:         ["interview_scheduled","rejected"],
  interview_scheduled: ["interview_completed","rejected"],
  interview_completed: ["offer_extended","rejected"],
  offer_extended:      ["offer_accepted","offer_declined"],
  offer_accepted:      ["hired"],
  offer_declined:      [],
  hired:               [],
  withdrawn:           [],
  rejected:            [],
};

const STATUS_MESSAGES: Record<string, { title: string; message: string }> = {
  shortlisted:         { title: "You've been shortlisted! 🎉", message: "Congratulations! An employer has shortlisted you for their internship position." },
  interview_scheduled: { title: "Interview Scheduled 📅", message: "Your interview has been scheduled. Check your candidacy details for the date and time." },
  offer_extended:      { title: "Offer Extended! 🎊", message: "You have received an internship offer! Please review and respond at your earliest convenience." },
  hired:               { title: "Internship Confirmed! 🚀", message: "Congratulations! Your internship placement has been confirmed. Welcome aboard!" },
  rejected:            { title: "Application Update", message: "Thank you for your interest. The employer has decided to move forward with other candidates." },
};

async function requireEmployer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") return { error: "Forbidden", status: 403 };
  return { user };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.stage.limit, LIMITS.stage.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const db = createAdminClient();
  // Fetch candidacy and verify employer owns the posting
  const { data: candidacy } = await db
    .from("internship_candidacies")
    .select(`
      id, status, student_id, application_id,
      internship_postings!inner(employer_id)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!candidacy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posting = Array.isArray(candidacy.internship_postings)
    ? candidacy.internship_postings[0]
    : candidacy.internship_postings as { employer_id: string } | null;

  if (posting?.employer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const newStatus = body.status as string | undefined;
  if (newStatus) {
    const allowed = VALID_TRANSITIONS[candidacy.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json({
        error: `Cannot transition from '${candidacy.status}' to '${newStatus}'`,
      }, { status: 409 });
    }
  }

  const allowed = ["status","interview_date","interview_notes","offer_allowance_sgd","offer_start_date","rejection_reason","employer_notes"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const { data, error } = await db
    .from("internship_candidacies")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Non-fatal notification to student
  if (newStatus && STATUS_MESSAGES[newStatus]) {
    const notif = STATUS_MESSAGES[newStatus];
    await notifyUser(db, {
      userId:        candidacy.student_id,
      applicationId: candidacy.application_id ?? undefined,
      title:         notif.title,
      message:       notif.message,
      type:          "application_update",
    });
  }

  return NextResponse.json({ candidacy: data });
}
