import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`notif-mark-all:${ip}`, LIMITS.notificationRead.limit, LIMITS.notificationRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminDb = createAdminClient();
  const readAt  = new Date().toISOString();

  const { error } = await adminDb
    .from("notifications")
    .update({ read_at: readAt })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[Notifications] mark-all-read error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ read_at: readAt }, { status: 200 });
}
