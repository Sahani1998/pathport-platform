import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/application-timeline";

// ─── PATCH /api/document-requests/[id] ───────────────────────────────────────
// Cancel a pending request (institution/admin only). Fulfilment happens
// automatically via DB trigger when the student uploads the document.

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`doc-request-update:${ip}`, LIMITS.documentRequest.limit, LIMITS.documentRequest.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    let action: string;
    try {
      const body = await request.json() as { action?: string };
      action = body.action ?? "";
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (action !== "cancel") {
      return NextResponse.json({ error: "action must be 'cancel'" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // RLS restricts institution users to requests on their own college's
    // applications — an out-of-scope id simply returns no row.
    const { data: docRequest } = await supabase
      .from("document_requests")
      .select("id, application_id, status, document_type, title")
      .eq("id", id)
      .single();
    if (!docRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (docRequest.status !== "pending") {
      return NextResponse.json({ error: `Cannot cancel a ${docRequest.status} request` }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from("document_requests")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await logAudit(supabase, {
      applicationId: docRequest.application_id,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        "document_request_cancelled",
      fromValue:     "pending",
      toValue:       "cancelled",
      metadata:      { request_id: id, document_type: docRequest.document_type, title: docRequest.title },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[DocRequest] cancel error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
