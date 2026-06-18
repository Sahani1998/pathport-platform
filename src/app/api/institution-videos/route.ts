import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { toEmbedUrl } from "@/lib/video-embed";
import type { InstitutionVideo } from "@/types/institution-videos";

interface CreateBody {
  title:       string;
  description?: string;
  video_url:   string;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`video-write:${ip}`, LIMITS.videoWrite.limit, LIMITS.videoWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (!profile || (profile.role !== "institution" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!profile.college_id) {
    return NextResponse.json({ error: "No college linked to your account" }, { status: 403 });
  }

  let body: CreateBody;
  try { body = await request.json() as CreateBody; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!body.video_url?.trim()) return NextResponse.json({ error: "video_url is required" }, { status: 400 });

  const embed = toEmbedUrl(body.video_url.trim());
  if (!embed) {
    return NextResponse.json({ error: "Only YouTube and Vimeo URLs are supported." }, { status: 400 });
  }

  const adminDb = createAdminClient();
  const { data: inserted, error: dbErr } = await adminDb
    .from("institution_videos")
    .insert({
      college_id:  profile.college_id,
      title:       body.title.trim(),
      description: body.description?.trim() || null,
      video_url:   body.video_url.trim(),
      embed_url:   embed,
      status:      "draft",
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (dbErr) {
    console.error("[videos POST]", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ video: inserted as InstitutionVideo }, { status: 201 });
}
