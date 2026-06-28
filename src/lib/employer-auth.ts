// Shared employer authorization helpers for API routes (Sprint E2).
// Resolves the calling user's company and enforces employer role.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

export interface EmployerContext {
  userId:    string;
  companyId: string | null;
}

// Returns { error, status } on failure, or { userId, companyId } on success.
export async function resolveEmployer(): Promise<
  | { error: string; status: number }
  | { ctx: EmployerContext }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") return { error: "Forbidden", status: 403 };

  const db = createAdminClient();
  const { data: company } = await db
    .from("employer_companies")
    .select("id")
    .eq("employer_id", user.id)
    .maybeSingle();

  return { ctx: { userId: user.id, companyId: (company?.id as string) ?? null } };
}
