import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { resolveEmployer } from "@/lib/employer-auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.coursesDelete.limit, LIMITS.coursesDelete.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = createAdminClient();
  const { data: media } = await db
    .from("employer_company_media")
    .select("id, bucket, path, media_type")
    .eq("id", id)
    .eq("company_id", r.ctx.companyId)
    .maybeSingle();
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.storage.from(media.bucket).remove([media.path]);
  const { error } = await db.from("employer_company_media").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (media.media_type === "logo") {
    await db.from("employer_companies").update({ logo_url: null }).eq("id", r.ctx.companyId);
  }
  return NextResponse.json({ ok: true });
}
