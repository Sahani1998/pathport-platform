import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

async function requireAdmin(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, forbidden: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase, user, forbidden: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { supabase, user, forbidden: null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`colleges-write:${ip}`, 20, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, forbidden } = await requireAdmin(request);
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const ALLOWED = ["name", "city", "country", "website", "description", "is_active"] as const;
  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED) {
    if (field in body) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("colleges")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`colleges-delete:${ip}`, 10, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, forbidden } = await requireAdmin(request);
  if (forbidden) return forbidden;

  // Block delete if courses exist
  const { count } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("college_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Remove all courses from this college before deleting it" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("colleges").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
