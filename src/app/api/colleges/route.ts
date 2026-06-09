import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`colleges-write:${ip}`, 10, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const name    = (body.name    as string | undefined)?.trim();
  const slug    = (body.slug    as string | undefined)?.trim();
  const country = ((body.country as string | undefined)?.trim()) || "Singapore";
  const city    = ((body.city    as string | undefined)?.trim()) || "Singapore";
  const website = (body.website as string | undefined)?.trim() || null;
  const description = (body.description as string | undefined)?.trim() || null;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  if (!/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers, and hyphens only" }, { status: 400 });

  const { data, error } = await supabase
    .from("colleges")
    .insert({ name, slug, country, city, website, description })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "A college with this slug already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
