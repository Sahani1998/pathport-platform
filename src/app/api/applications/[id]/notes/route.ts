import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/application-timeline";
import type { ApplicationNoteWithAuthor } from "@/types/application-processing";

// Internal application notes — institution (own college) + admin only.
// Students never see these: there is no student RLS policy on the table
// and this route additionally gates on role.

// ─── POST /api/applications/[id]/notes ───────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`app-notes:${ip}`, LIMITS.notes.limit, LIMITS.notes.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    let content: string;
    try {
      const body = await request.json() as { content?: string };
      content = (body.content ?? "").trim();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });
    if (content.length > 4000) content = content.slice(0, 4000);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Insert through RLS — institution users can only write notes on
    // applications belonging to their own college.
    const { data: note, error: insertError } = await supabase
      .from("application_notes")
      .insert({
        application_id: id,
        author_id:      user.id,
        author_role:    profile.role,
        content,
      })
      .select()
      .single();

    if (insertError) {
      const status = insertError.code === "42501" ? 403 : 500;
      return NextResponse.json({ error: insertError.message }, { status });
    }

    await logAudit(supabase, {
      applicationId: id,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        "note_added",
      metadata:      { note_id: note.id },
    });

    return NextResponse.json(note, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AppNotes] create error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET /api/applications/[id]/notes ────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`app-notes-list:${ip}`, 60, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "institution"].includes(profile.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { data: notes, error } = await supabase
    .from("application_notes")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Two-query pattern: author_id references auth.users, so PostgREST implicit
  // joins to profiles are unavailable — batch-fetch author names separately.
  const authorIds = Array.from(new Set((notes ?? []).map(n => n.author_id).filter(Boolean))) as string[];
  const authorNames = new Map<string, string | null>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles").select("id, full_name").in("id", authorIds);
    for (const a of authors ?? []) authorNames.set(a.id, a.full_name);
  }

  const result: ApplicationNoteWithAuthor[] = (notes ?? []).map(n => ({
    ...n,
    author_name: n.author_id ? (authorNames.get(n.author_id) ?? null) : null,
  }));

  return NextResponse.json(result);
}
