import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Notification id is required" }, { status: 400 });
  }

  const adminDb = createAdminClient();

  // Verify ownership before updating
  const { data: notif, error: fetchError } = await adminDb
    .from("notifications")
    .select("id, user_id, read_at")
    .eq("id", id)
    .single();

  if (fetchError || !notif) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  if (notif.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (notif.read_at) {
    return NextResponse.json({ read_at: notif.read_at }, { status: 200 });
  }

  const readAt = new Date().toISOString();
  const { error: updateError } = await adminDb
    .from("notifications")
    .update({ read_at: readAt })
    .eq("id", id);

  if (updateError) {
    console.error("[Notifications] mark-read error:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ read_at: readAt }, { status: 200 });
}
