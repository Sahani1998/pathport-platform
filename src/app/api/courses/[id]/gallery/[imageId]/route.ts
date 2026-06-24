import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

async function resolveGalleryImage(courseId: string, imageId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { forbidden: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  if (!profile || (profile.role !== "institution" && profile.role !== "admin"))
    return { forbidden: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  const adminDb = createAdminClient();
  const { data: image } = await adminDb
    .from("course_gallery")
    .select("id, course_id, college_id, storage_path, sort_order, alt_text")
    .eq("id", imageId)
    .eq("course_id", courseId)
    .single();

  if (!image) return { forbidden: NextResponse.json({ error: "Image not found" }, { status: 404 }) };

  if (profile.role === "institution" && profile.college_id !== image.college_id)
    return { forbidden: NextResponse.json({ error: "Forbidden — not your course" }, { status: 403 }) };

  return { forbidden: null, user, image, adminDb };
}

// ── DELETE — remove gallery image ──────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const { id: courseId, imageId } = await params;

  const resolved = await resolveGalleryImage(courseId, imageId);
  if (resolved.forbidden) return resolved.forbidden;
  const { user, image, adminDb } = resolved;

  if (image.storage_path) {
    await adminDb.storage.from("course-media").remove([image.storage_path]);
  }

  const { error } = await adminDb
    .from("course_gallery")
    .delete()
    .eq("id", imageId);

  if (error) {
    console.error("[gallery delete]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await adminDb.from("course_media_audit").insert({
    course_id:    courseId,
    college_id:   image.college_id,
    user_id:      user.id,
    action:       "delete_gallery_image",
    storage_path: image.storage_path,
  });

  return new NextResponse(null, { status: 204 });
}

// ── PATCH — update sort_order or alt_text ──────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const { id: courseId, imageId } = await params;

  const resolved = await resolveGalleryImage(courseId, imageId);
  if (resolved.forbidden) return resolved.forbidden;
  const { image, adminDb } = resolved;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const patch: Record<string, unknown> = {};
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order))
    patch.sort_order = Math.trunc(body.sort_order);
  if (typeof body.alt_text === "string")
    patch.alt_text = body.alt_text.trim() || null;

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const { data, error } = await adminDb
    .from("course_gallery")
    .update(patch)
    .eq("id", imageId)
    .select()
    .single();

  if (error) {
    console.error("[gallery patch]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void image; // ownership already verified above
  return NextResponse.json({ image: data });
}
