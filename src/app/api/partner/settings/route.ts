import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

export async function PATCH(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`partner-settings:${ip}`, LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "recruitment_partner") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const full_name = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 200) : undefined;
    const phone     = typeof body.phone     === "string" ? body.phone.trim().slice(0, 30)  : undefined;
    const country   = typeof body.country   === "string" ? body.country.trim().slice(0, 100) : undefined;

    const updates: Record<string, string> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined)     updates.phone     = phone;
    if (country !== undefined)   updates.country   = country;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (updateError) {
      console.error("[PartnerSettings] update error:", updateError.message);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PartnerSettings] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
