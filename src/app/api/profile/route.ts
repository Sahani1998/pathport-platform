import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`profile:${ip}`, 10, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const fullName = (body.full_name as string | undefined)?.trim();
  const phone    = (body.phone    as string | undefined)?.trim() || null;
  const country  = (body.country  as string | undefined)?.trim() || null;

  if (!fullName)               return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (fullName.length < 2)    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  if (fullName.length > 100)  return NextResponse.json({ error: "Name must be under 100 characters" }, { status: 400 });

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone, country, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("full_name, phone, country")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
