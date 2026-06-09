import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`profile-edu:${ip}`, 20, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const institution_name = String(body.institution_name ?? "").trim();
  const qualification    = String(body.qualification    ?? "").trim();
  const field_of_study   = body.field_of_study ? String(body.field_of_study).trim() : null;
  const grade            = body.grade          ? String(body.grade).trim()          : null;
  const start_year       = typeof body.start_year === "number" ? body.start_year : null;
  const end_year         = typeof body.end_year   === "number" ? body.end_year   : null;
  const is_current       = body.is_current === true;

  if (!institution_name) return NextResponse.json({ error: "Institution name required" }, { status: 400 });
  if (!qualification)    return NextResponse.json({ error: "Qualification required" },    { status: 400 });

  const currentYear = new Date().getFullYear();
  if (start_year !== null && (start_year < 1950 || start_year > currentYear + 1)) {
    return NextResponse.json({ error: "Invalid start year" }, { status: 400 });
  }
  if (end_year !== null && (end_year < 1950 || end_year > currentYear + 10)) {
    return NextResponse.json({ error: "Invalid end year" }, { status: 400 });
  }
  if (start_year !== null && end_year !== null && end_year < start_year) {
    return NextResponse.json({ error: "End year cannot be before start year" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("student_education")
    .insert({
      user_id: user.id,
      institution_name, qualification, field_of_study,
      start_year, end_year, grade, is_current,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
