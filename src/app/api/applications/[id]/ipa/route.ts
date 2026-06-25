import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { recordTimelineEvent, notifyUser, logAudit } from "@/lib/application-timeline";
import { scanFile } from "@/lib/virus-scan";
import { STAGE_TO_STATUS } from "@/lib/application-workflow";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// Stages from which uploading an IPA moves the application to ipa_processing.
const PRE_IPA_STAGES = [
  "application_submitted", "documents_pending", "documents_uploaded",
  "documents_under_review", "documents_verified", "offer_letter_processing",
  "offer_letter_ready", "offer_letter_accepted", "fee_payment_pending",
];

// ─── POST /api/applications/[id]/ipa ─────────────────────────────────────────
// Institution/admin uploads the IPA document for an application.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`ipa-upload:${ip}`, LIMITS.ipaWrite.limit, LIMITS.ipaWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role, college_id").eq("id", user.id).single();
    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file     = formData.get("file") as File | null;
    const rawNotes = String(formData.get("notes") ?? "").trim() || null;
    const notes    = rawNotes && rawNotes.length > 2000 ? rawNotes.slice(0, 2000) : rawNotes;

    if (!file) return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
    }

    // Application + institution scope check
    const { data: app } = await supabase
      .from("applications")
      .select("id, student_id, course_id, current_stage, courses (title, college_id, colleges (name))")
      .eq("id", id)
      .single();
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    type RawCourse = { title: string; college_id: string; colleges: { name: string } | { name: string }[] | null };
    const rawCourse = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;
    if (profile.role === "institution" && rawCourse?.college_id !== profile.college_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ── Upload to storage ─────────────────────────────────────────────────────
    const storagePath = `${rawCourse?.college_id ?? "shared"}/applications/${id}/${Date.now()}-ipa.pdf`;
    const fileBuffer  = await file.arrayBuffer();

    // Virus / magic-byte scan before storage write
    const scan = await scanFile(fileBuffer, file.name, file.type);
    if (scan.status === "threat") {
      console.warn(`[IPA] scan blocked file: ${file.name} threat=${scan.threat} user=${user.id}`);
      return NextResponse.json(
        { error: "File was rejected by the security scanner. Please ensure the PDF is not corrupted and try again." },
        { status: 422 },
      );
    }

    const { error: storageErr } = await supabase.storage
      .from("ipa-documents")
      .upload(storagePath, fileBuffer, { contentType: "application/pdf", upsert: false });
    if (storageErr) {
      return NextResponse.json({ error: `Storage upload failed: ${storageErr.message}` }, { status: 500 });
    }

    // Sprint 23 — only ONE active (draft|issued) IPA per application is allowed.
    // Mark any prior issued row as 'superseded' BEFORE inserting the new one.
    const now = new Date().toISOString();
    const { data: priorActive } = await supabase
      .from("ipa_records")
      .select("id")
      .eq("application_id", id)
      .in("lifecycle_status", ["draft", "issued"])
      .maybeSingle();
    const priorActiveId = (priorActive as { id: string } | null)?.id ?? null;

    if (priorActiveId) {
      const { error: supErr } = await supabase
        .from("ipa_records")
        .update({ lifecycle_status: "superseded", superseded_at: now })
        .eq("id", priorActiveId);
      if (supErr) {
        await supabase.storage.from("ipa-documents").remove([storagePath]);
        return NextResponse.json({ error: `Could not supersede prior IPA: ${supErr.message}` }, { status: 500 });
      }
    }

    // ── Insert record ─────────────────────────────────────────────────────────
    // Sprint 23 — until the draft → issue UI ships in PR B, the existing flow
    // keeps creating IPAs in lifecycle_status='issued' so students keep
    // seeing them. PR B will let institutions create as 'draft' and Issue.
    const { data: record, error: insertErr } = await supabase
      .from("ipa_records")
      .insert({
        application_id:   id,
        uploaded_by:      user.id,
        file_path:        storagePath,
        file_name:        file.name,
        file_size:        file.size,
        status:           "submitted",
        lifecycle_status: "issued",
        issued_at:        now,
        issued_by:        user.id,
        notes,
      })
      .select()
      .single();

    if (!insertErr && priorActiveId) {
      await supabase
        .from("ipa_records")
        .update({ superseded_by_id: (record as { id: string }).id })
        .eq("id", priorActiveId);
    }

    if (insertErr) {
      await supabase.storage.from("ipa-documents").remove([storagePath]);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // ── Advance stage to ipa_processing if still earlier in the pipeline ─────
    const currentStage = app.current_stage ?? "application_submitted";
    if (PRE_IPA_STAGES.includes(currentStage)) {
      await supabase
        .from("applications")
        .update({
          current_stage:    "ipa_processing",
          status:           STAGE_TO_STATUS.ipa_processing,
          stage_updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    // ── Side effects ──────────────────────────────────────────────────────────
    await recordTimelineEvent(supabase, {
      applicationId: id,
      stage:         "ipa_processing",
      title:         "IPA Submitted to ICA by College",
      description:   `Your college has submitted your IPA application to ICA Singapore.${notes ? ` ${notes}` : ""}`,
      createdBy:     user.id,
      createdByRole: profile.role,
    });

    await notifyUser(supabase, {
      userId:        app.student_id,
      applicationId: id,
      title:         "IPA Processing Started 🪪",
      message:       "Your college has submitted your In-Principle Approval to ICA Singapore. Processing typically takes 2–4 weeks. PathPort will keep you updated.",
      type:          "application_update",
    });

    await logAudit(supabase, {
      applicationId: id,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        "ipa_uploaded",
      fromValue:     currentStage,
      toValue:       "ipa_processing",
      comments:      notes,
      metadata:      { ipa_record_id: record.id, file_name: file.name, file_size: file.size },
    });

    // ── Email (non-fatal) ─────────────────────────────────────────────────────
    const { data: student } = await supabase
      .from("profiles").select("email, full_name").eq("id", app.student_id).single();
    if (student?.email) {
      sendTemplatedEmail({
        to:       student.email,
        template: "ipa_processing",
        context:  { name: student.full_name ?? "there", courseName: rawCourse?.title },
        applicationId: id,
        userId:   app.student_id,
        metadata: { ipa_record_id: record.id },
      }).catch(err => console.error("[IPA] email failed (non-fatal):", err));
    }

    console.log("[IPA] uploaded:", record.id, "for app:", id);
    return NextResponse.json(record, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[IPA] upload error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET /api/applications/[id]/ipa ──────────────────────────────────────────
// List IPA records for an application. RLS scopes visibility.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`ipa-list:${ip}`, 60, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("ipa_records")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
