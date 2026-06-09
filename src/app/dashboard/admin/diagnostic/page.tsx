import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, Database, Shield } from "lucide-react";

export const metadata = { title: "Diagnostics — Admin" };
export const dynamic = "force-dynamic";

type CountResult = { count: number | null; error: { code?: string; message: string } | null };

async function runCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  filter?: { col: string; val: string },
): Promise<CountResult> {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter.col, filter.val);
  const { count, error } = await q;
  return { count: count ?? null, error: error ? { code: error.code, message: error.message } : null };
}

export default async function AdminDiagnosticPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Profile lookup (own-read policy — non-recursive)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, email, full_name")
    .eq("id", user.id)
    .single();

  // RPC call to SECURITY DEFINER admin check.  Bypasses RLS internally.
  const { data: isAdminRpc, error: rpcError } = await supabase.rpc("requesting_user_is_admin");

  // If the user isn't actually admin, redirect — but only AFTER computing
  // diagnostics so the page can still surface the reason.
  const profileSaysAdmin = profile?.role === "admin";
  const rpcSaysAdmin     = isAdminRpc === true;

  // Run all admin-scoped count queries.  Each catches its own RLS error.
  const [
    profilesAll, profilesStudents, profilesAdmins,
    applicationsAll, collegesAll, coursesAll, inquiriesAll,
    notificationsAll, timelineAll, documentsAll, offerLettersAll,
  ] = await Promise.all([
    runCount(supabase, "profiles"),
    runCount(supabase, "profiles", { col: "role", val: "student" }),
    runCount(supabase, "profiles", { col: "role", val: "admin" }),
    runCount(supabase, "applications"),
    runCount(supabase, "colleges"),
    runCount(supabase, "courses"),
    runCount(supabase, "student_inquiries"),
    runCount(supabase, "notifications"),
    runCount(supabase, "application_timeline_events"),
    runCount(supabase, "student_documents"),
    runCount(supabase, "offer_letters"),
  ]);

  // Replicate the EXACT shape the admin/applications page now uses.
  // If RLS is fine but the page still shows 0, this confirms it.
  const { data: appsSample, error: appsSampleErr } = await supabase
    .from("applications")
    .select("id, student_id, current_stage, submitted_at, courses ( title, colleges ( name ) )")
    .order("submitted_at", { ascending: false })
    .limit(5);

  const rows: { label: string; result: CountResult; critical?: boolean }[] = [
    { label: "profiles (all)",                  result: profilesAll,        critical: true },
    { label: "profiles role = student",         result: profilesStudents,   critical: true },
    { label: "profiles role = admin",           result: profilesAdmins                    },
    { label: "applications",                    result: applicationsAll,    critical: true },
    { label: "colleges",                        result: collegesAll                       },
    { label: "courses",                         result: coursesAll                        },
    { label: "student_inquiries",               result: inquiriesAll                      },
    { label: "notifications",                   result: notificationsAll                  },
    { label: "application_timeline_events",     result: timelineAll                       },
    { label: "student_documents",               result: documentsAll                      },
    { label: "offer_letters",                   result: offerLettersAll                   },
  ];

  const anyRlsBlocked   = rows.some(r => r.result.error?.code === "42P17" || r.result.error?.code === "42501");
  const anyRecursion    = rows.some(r => r.result.error?.code === "42P17");
  const profileRoleOk   = profileSaysAdmin;
  const rpcAdminOk      = rpcSaysAdmin;
  const overallOk       = profileRoleOk && rpcAdminOk && !anyRlsBlocked;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-gold-400" />
          <h2 className="font-display text-3xl text-white">Admin Diagnostics</h2>
        </div>
        <p className="text-white/40 font-body text-sm">
          Verifies your session, RLS helper function, and per-table read access.
        </p>
      </div>

      {/* Overall verdict */}
      <div className={`rounded-2xl border p-5 ${
        overallOk
          ? "bg-emerald-500/[0.07] border-emerald-500/30"
          : "bg-red-500/[0.07] border-red-500/30"
      }`}>
        <div className="flex items-start gap-3">
          {overallOk
            ? <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            : <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />}
          <div className="min-w-0">
            <p className={`font-display text-xl mb-1 ${overallOk ? "text-emerald-300" : "text-red-300"}`}>
              {overallOk ? "Admin access is fully wired up" : "Admin access is broken"}
            </p>
            <p className="text-white/55 font-body text-sm">
              {overallOk
                ? "All admin queries returned data with no RLS errors."
                : anyRecursion
                  ? "RLS recursion detected (error 42P17). Run src/lib/supabase/admin_rls_fix.sql in the Supabase SQL Editor."
                  : !rpcAdminOk
                    ? "requesting_user_is_admin() returned false. Either the helper function is missing or your profile.role is not 'admin'."
                    : !profileRoleOk
                      ? `Your profile.role is "${profile?.role ?? "unknown"}" — not "admin". Update it in the profiles table.`
                      : "Some tables are unreadable. See details below."}
            </p>
          </div>
        </div>
      </div>

      {/* Identity panel */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.07] flex items-center gap-2">
          <Database className="w-4 h-4 text-pathBlue-400" />
          <h3 className="font-display text-lg text-white">Identity</h3>
        </div>
        <dl className="divide-y divide-white/[0.05]">
          <Row label="auth.uid()"            value={user.id} />
          <Row label="user.email"            value={user.email ?? "—"} />
          <Row label="user.email_confirmed"  value={user.email_confirmed_at ? "yes" : "no"} />
          <Row label="auth.getUser error"    value={userError?.message ?? "none"} ok={!userError} />
          <Row
            label="profile.role"
            value={profile?.role ?? `null (error: ${profileError?.message ?? "no row"})`}
            ok={profileRoleOk}
          />
          <Row
            label="requesting_user_is_admin()"
            value={
              rpcError
                ? `error: ${rpcError.code ?? ""} ${rpcError.message}`
                : isAdminRpc === true ? "true" : isAdminRpc === false ? "false" : "null"
            }
            ok={rpcAdminOk}
          />
        </dl>
      </div>

      {/* RLS test panel */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.07] flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold-400" />
          <h3 className="font-display text-lg text-white">Admin-scoped reads</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-2.5 text-white/30 font-body text-xs uppercase tracking-wider">Table</th>
              <th className="text-left px-5 py-2.5 text-white/30 font-body text-xs uppercase tracking-wider">Count</th>
              <th className="text-left px-5 py-2.5 text-white/30 font-body text-xs uppercase tracking-wider">Error</th>
              <th className="text-left px-5 py-2.5 text-white/30 font-body text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, result, critical }) => {
              const ok        = !result.error;
              const recursion = result.error?.code === "42P17";
              return (
                <tr key={label} className="border-b border-white/[0.04]">
                  <td className="px-5 py-3 font-body text-sm text-white/75">{label}</td>
                  <td className="px-5 py-3 font-body text-sm text-white/85 tabular-nums">
                    {ok ? (result.count ?? 0) : "—"}
                  </td>
                  <td className="px-5 py-3 font-body text-xs text-white/55 max-w-md">
                    {result.error
                      ? <span className="text-red-400">{result.error.code} · {result.error.message}</span>
                      : <span className="text-white/30">none</span>}
                  </td>
                  <td className="px-5 py-3">
                    {ok
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : recursion
                        ? <AlertTriangle className="w-4 h-4 text-red-400" />
                        : critical
                          ? <XCircle className="w-4 h-4 text-red-400" />
                          : <AlertTriangle className="w-4 h-4 text-gold-400" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sample admin-scoped applications query */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.07] flex items-center gap-2">
          <Database className="w-4 h-4 text-pathBlue-400" />
          <h3 className="font-display text-lg text-white">applications query — top 5</h3>
        </div>
        <div className="p-5">
          {appsSampleErr ? (
            <p className="font-body text-sm text-red-400">
              <code className="text-red-300">{appsSampleErr.code}</code> · {appsSampleErr.message}
            </p>
          ) : (appsSample?.length ?? 0) === 0 ? (
            <p className="font-body text-sm text-white/45">No rows returned (RLS may be blocking, or table is empty).</p>
          ) : (
            <pre className="font-mono text-xs text-white/70 overflow-x-auto">
              {JSON.stringify(appsSample, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Fix banner */}
      {!overallOk && (
        <div className="bg-gold-400/[0.07] border border-gold-400/30 rounded-2xl p-5">
          <p className="font-display text-lg text-gold-300 mb-2">How to fix</p>
          <ol className="space-y-1.5 text-white/70 font-body text-sm list-decimal pl-5">
            <li>Open the Supabase Dashboard → SQL Editor.</li>
            <li>Paste the contents of <code className="text-gold-300 bg-gold-400/10 px-1.5 py-0.5 rounded text-xs">src/lib/supabase/admin_rls_fix.sql</code>.</li>
            <li>Click Run. The file is safe to re-run.</li>
            <li>Reload this page to confirm everything turns green.</li>
            <li>If <code className="text-gold-300 bg-gold-400/10 px-1.5 py-0.5 rounded text-xs">profile.role</code> is not <code className="text-gold-300 bg-gold-400/10 px-1.5 py-0.5 rounded text-xs">admin</code>, update it manually:
              <pre className="mt-2 p-3 bg-navy-900 rounded-xl text-xs text-pathBlue-300 overflow-x-auto">{`UPDATE public.profiles SET role = 'admin' WHERE email = '${user.email ?? "your-admin@email.com"}';`}</pre>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="px-5 py-3 flex items-start justify-between gap-4">
      <dt className="font-body text-sm text-white/45 flex-shrink-0">{label}</dt>
      <dd className="font-body text-sm text-white/85 text-right break-all flex items-center gap-2">
        <span>{value}</span>
        {ok === true  && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
        {ok === false && <XCircle      className="w-4 h-4 text-red-400 flex-shrink-0" />}
      </dd>
    </div>
  );
}
