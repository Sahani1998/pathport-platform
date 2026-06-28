// ═══════════════════════════════════════════════════════════════════════════
// PathPort — Applicant profile resolution (single source of truth)
//
// `applications.student_id` and `posting_eligibility.student_id` reference
// auth.users(id), NOT public.profiles. There is therefore NO foreign key from
// those tables to `profiles`, so PostgREST CANNOT embed profiles inline —
// `student:profiles!..._student_id_fkey(...)` errors the WHOLE query and yields
// null/zero rows. (This silently broke the institution Internship Access page
// and the recruitment-partner dashboards.)
//
// The correct, proven pattern — used by the institution students/dashboard/
// applications pages — is to batch-load profiles by id. This helper centralises
// it so no page hand-rolls (or mis-embeds) it again.
// ═══════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";

export interface StudentProfile {
  id:         string;
  full_name:  string | null;
  email:      string | null;
  country:    string | null;
}

// Returns a Map keyed by profile id (= student_id). Missing profiles are simply
// absent from the map; callers fall back to placeholders.
export async function loadStudentProfiles(
  db: SupabaseClient,
  studentIds: (string | null | undefined)[],
): Promise<Map<string, StudentProfile>> {
  const ids = Array.from(new Set(studentIds.filter((x): x is string => Boolean(x))));
  const map = new Map<string, StudentProfile>();
  if (ids.length === 0) return map;

  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, email, country")
    .in("id", ids);

  if (error) {
    console.error("[loadStudentProfiles] failed:", error.message);
    return map;
  }
  for (const p of data ?? []) {
    const row = p as StudentProfile;
    map.set(row.id, row);
  }
  return map;
}
