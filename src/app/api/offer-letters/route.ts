import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { getStageMeta, STAGE_NOTIFICATION } from "@/types/timeline";
import { STAGE_TO_STATUS } from "@/lib/application-stage-mapping";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME   = new Set(["application/pdf"]);

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`offer-upload:${ip}`, LIMITS.offerLetterUpload.limit, LIMITS.offerLetterUpload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, college_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "institution"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const applicationId = String(formData.get("application_id") ?? "").trim();
  const rawNotes      = String(formData.get("notes")         ?? "").trim() || null;
  const expiryDate    = String(formData.get("expiry_date")   ?? "").trim() || null;
  const file          = formData.get("file") as File | null;

  // Length limits
  const notes = rawNotes && rawNotes.length > 2000
    ? rawNotes.slice(0, 2000)
    : rawNotes;

  if (!applicationId) return NextResponse.json({ error: "application_id is required" }, { status: 400 });
  if (!file)           return NextResponse.json({ error: "PDF file is required" },     { status: 400 });
  if (!ALLOWED_MIME.has(file.type))
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES)
    return NextResponse.json({ error: "File exceeds 10 MB limit" },   { status: 400 });
  if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate))
    return NextResponse.json({ error: "expiry_date must be in YYYY-MM-DD format" }, { status: 400 });

  // Fetch application + related context
  const { data: app } = await supabase
    .from("applications")
    .select(`
      id, student_id, course_id, current_stage,
      courses (id, title, college_id, colleges (id, name))
    `)
    .eq("id", applicationId)
    .single();

  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  // Institution scope guard — must match their college
  type RawCourse = { id: string; title: string; college_id: string; colleges: { id: string; name: string } | { id: string; name: string }[] | null };
  const rawCourse  = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;
  const rawCollege = rawCourse ? (Array.isArray(rawCourse.colleges) ? rawCourse.colleges[0] : rawCourse.colleges) : null;
  const courseCollegeId = rawCourse?.college_id;

  if (profile.role === "institution" && profile.college_id !== courseCollegeId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Determine next version number
  const { data: versions } = await supabase
    .from("offer_letters")
    .select("version")
    .eq("application_id", applicationId)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = ((versions?.[0] as { version: number } | undefined)?.version ?? 0) + 1;

  // Upload file to Supabase Storage
  const fileBuffer  = await file.arrayBuffer();
  const timestamp   = Date.now();
  const storagePath = `${applicationId}/${timestamp}-v${nextVersion}.pdf`;

  const { error: storageErr } = await supabase.storage
    .from("offer-letters")
    .upload(storagePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (storageErr) {
    return NextResponse.json({ error: `Storage upload failed: ${storageErr.message}` }, { status: 500 });
  }

  // Insert offer_letter row
  const now = new Date().toISOString();
  const { data: letter, error: insertErr } = await supabase
    .from("offer_letters")
    .insert({
      application_id: applicationId,
      uploaded_by:    user.id,
      file_path:      storagePath,
      file_name:      file.name,
      file_size:      file.size,
      version:        nextVersion,
      notes,
      expiry_date:    expiryDate || null,
      created_at:     now,
      updated_at:     now,
    })
    .select()
    .single();

  if (insertErr) {
    // Roll back storage upload on DB failure
    await supabase.storage.from("offer-letters").remove([storagePath]);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Advance application to offer_letter_ready
  const stage = "offer_letter_ready" as const;
  const newStatus = STAGE_TO_STATUS[stage];

  await supabase
    .from("applications")
    .update({
      current_stage:    stage,
      status:           newStatus,
      stage_updated_at: now,
    })
    .eq("id", applicationId);

  // Timeline event
  const stageMeta = getStageMeta(stage);
  await supabase.from("application_timeline_events").insert({
    application_id:     applicationId,
    stage,
    title:              stageMeta.label,
    description:        notes
      ? `Offer letter issued (v${nextVersion}). ${notes}`
      : `Offer letter issued (v${nextVersion}).`,
    created_by:         user.id,
    created_by_role:    profile.role,
    visible_to_student: true,
  });

  // Audit log
  await supabase.from("application_audit_log").insert({
    application_id: applicationId,
    actor_id:       user.id,
    actor_role:     profile.role,
    action:         "offer_letter_uploaded",
    from_value:     app.current_stage ?? "unknown",
    to_value:       stage,
    reason:         null,
    comments:       notes,
    metadata: {
      offer_letter_id: (letter as { id: string }).id,
      version:         nextVersion,
      file_name:       file.name,
      file_size:       file.size,
      college_id:      courseCollegeId ?? null,
    },
  });

  // In-app notification for student
  const notifTemplate = STAGE_NOTIFICATION[stage];
  if (notifTemplate) {
    await supabase.from("notifications").insert({
      user_id:        app.student_id,
      application_id: applicationId,
      title:          notifTemplate.title,
      message:        notifTemplate.message,
      type:           notifTemplate.type,
    });
  }

  // Email — non-fatal
  const [{ data: studentProfile }, { data: courseData }] = await Promise.all([
    supabase.from("profiles").select("email, full_name").eq("id", app.student_id).single(),
    supabase.from("courses").select("title").eq("id", app.course_id).single(),
  ]);

  if (studentProfile?.email) {
    sendTemplatedEmail({
      to:       studentProfile.email,
      template: "offer_letter_available",
      context: {
        name:        studentProfile.full_name ?? "Student",
        courseName:  (courseData as { title: string } | null)?.title ?? rawCourse?.title ?? "your course",
        collegeName: rawCollege?.name ?? "",
      },
      applicationId,
      userId: app.student_id,
    }).catch(err => console.error("[OfferLetter] email failed (non-fatal):", err));
  }

  return NextResponse.json(letter, { status: 201 });
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`offer-list:${ip}`, 30, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, college_id")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url     = new URL(request.url);
  const appId   = url.searchParams.get("application_id")?.trim();
  if (!appId) return NextResponse.json({ error: "application_id is required" }, { status: 400 });

  // Build query — RLS enforces access; join uploader name for display
  const { data, error } = await supabase
    .from("offer_letters")
    .select(`
      id, application_id, uploaded_by, file_path, file_name,
      file_size, version, notes, expiry_date, created_at, updated_at,
      profiles!offer_letters_uploaded_by_fkey (full_name)
    `)
    .eq("application_id", appId)
    .order("version", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten uploader name
  const letters = (data ?? []).map((row: Record<string, unknown>) => {
    const uploaderProfile = row.profiles as { full_name: string | null } | null;
    const { profiles: _p, ...rest } = row;
    return { ...rest, uploader_name: uploaderProfile?.full_name ?? null };
  });

  return NextResponse.json(letters);
}
