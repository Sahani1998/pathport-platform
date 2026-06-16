import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import CourseFormClient from "@/components/courses/CourseFormClient";
import type { Course } from "@/types/courses";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }    = await params;
  const supabase  = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name, college_id").eq("id", user.id).single();

  if (profile?.role !== "institution") redirect("/dashboard");
  if (!profile?.college_id) redirect("/dashboard/institution/courses");

  const { data: course, error } = await supabase
    .from("courses").select("*").eq("id", id).single();

  if (error || !course) notFound();

  // Verify this course belongs to the institution's college
  if (course.college_id !== profile.college_id) redirect("/dashboard/institution/courses");

  const { data: college } = await supabase
    .from("colleges").select("id, name").eq("id", profile.college_id).single();

  return (
    <div className="max-w-3xl">
      <CourseFormClient
        collegeId={profile.college_id}
        collegeName={college?.name ?? "Your College"}
        course={course as Course}
      />
    </div>
  );
}
