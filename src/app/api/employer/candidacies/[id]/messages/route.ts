import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/application-timeline";

// Shared by employer and student — message thread for a candidacy.
async function authParticipant(candidacyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const db = createAdminClient();
  const { data: cand } = await db
    .from("candidacies")
    .select(`id, student_id, postings!inner(employer_id)`)
    .eq("id", candidacyId)
    .maybeSingle();
  if (!cand) return { error: "Not found", status: 404 };

  const posting = Array.isArray(cand.postings) ? cand.postings[0] : cand.postings as Record<string, unknown> | null;
  const isStudent  = cand.student_id === user.id;
  const isEmployer = (posting?.employer_id as string) === user.id;
  if (!isStudent && !isEmployer && profile?.role !== "admin") return { error: "Forbidden", status: 403 };

  return {
    user, db,
    role: isEmployer ? "employer" : isStudent ? "student" : "admin",
    counterpartId: isEmployer ? (cand.student_id as string) : (posting?.employer_id as string),
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.notificationRead.limit, LIMITS.notificationRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const a = await authParticipant(id);
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { data, error } = await a.db
    .from("candidacy_messages")
    .select("id, sender_id, sender_role, message, read_at, created_at")
    .eq("candidacy_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.notes.limit, LIMITS.notes.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const a = await authParticipant(id);
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const message = (body.message as string | undefined)?.trim();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const { data, error } = await a.db.from("candidacy_messages").insert({
    candidacy_id: id,
    sender_id:    a.user.id,
    sender_role:  a.role,
    message,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify the counterpart
  if (a.counterpartId) {
    await notifyUser(a.db, {
      userId:  a.counterpartId,
      title:   "New message",
      message: "You have a new message regarding an internship application.",
      type:    "application_update",
    });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
