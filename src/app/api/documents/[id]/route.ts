import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`doc-review:${ip}`, LIMITS.documentReview.limit, LIMITS.documentReview.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  console.log("[DocumentReview] PATCH /api/documents/", id);

  try {
    let status: string;
    let rejection_reason: string | null;

    try {
      const body = await request.json() as { status?: string; rejection_reason?: string | null };
      status           = body.status ?? "";
      rejection_reason = body.rejection_reason ?? null;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!["pending", "verified", "rejected", "reupload_required"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify caller is institution or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    console.log("[DocumentReview] updating document", id, "→", status, "by", user.id);

    const { error: updateError } = await supabase
      .from("student_documents")
      .update({
        status,
        rejection_reason: status === "rejected" ? rejection_reason : null,
        reviewed_at:      new Date().toISOString(),
        reviewed_by:      user.id,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[DocumentReview] update error:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("[DocumentReview] document status updated successfully");
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[DocumentReview] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
