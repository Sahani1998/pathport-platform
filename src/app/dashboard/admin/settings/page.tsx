import { Mail, Shield, Zap } from "lucide-react";
import EmailTestPanel from "@/components/admin/EmailTestPanel";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Detect Resend config server-side so the banner is accurate on first render
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const fromAddress      = process.env.RESEND_FROM_EMAIL ?? "noreply@pathport.sg";
  const siteUrl          = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pathport.sg";

  // Email log summary — last 24 h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: logRows } = await supabase
    .from("email_log")
    .select("status")
    .gte("created_at", since);

  const counts = { sent: 0, failed: 0, skipped: 0, queued: 0 };
  for (const r of (logRows ?? []) as { status: string }[]) {
    if (r.status in counts) counts[r.status as keyof typeof counts]++;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Settings</h2>
        <p className="text-white/40 font-body text-sm">Platform configuration and system diagnostics</p>
      </div>

      {/* ── Email System ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-gold-400" />
          <h3 className="font-display text-lg text-white">Email System</h3>
        </div>

        {/* Config details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Provider",   value: "Resend" },
            { label: "From",       value: fromAddress },
            { label: "Site URL",   value: siteUrl },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-white/75 font-body text-xs truncate font-mono">{value}</p>
            </div>
          ))}
        </div>

        {/* Last 24 h stats */}
        <div className="grid grid-cols-4 gap-3">
          {([
            { label: "Sent",    key: "sent",    color: "text-emerald-400" },
            { label: "Failed",  key: "failed",  color: "text-red-400"     },
            { label: "Skipped", key: "skipped", color: "text-amber-400"   },
            { label: "Queued",  key: "queued",  color: "text-white/50"    },
          ] as const).map(({ label, key, color }) => (
            <div key={key} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
              <p className={`font-display text-2xl font-bold ${color}`}>{counts[key]}</p>
              <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mt-0.5">{label}</p>
              <p className="text-white/20 font-body text-[9px] mt-0.5">last 24 h</p>
            </div>
          ))}
        </div>

        {/* Test panel */}
        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-3.5 h-3.5 text-gold-400" />
            <p className="font-body text-sm font-semibold text-white/80">Send a test email</p>
          </div>
          <EmailTestPanel isConfigured={resendConfigured} />
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-gold-400" />
          <h3 className="font-display text-lg text-white">Security & Rate Limits</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Login guard",       value: "5 / min / IP + email" },
            { label: "Inquiry form",      value: "3 / min / IP"         },
            { label: "Apply",             value: "10 / min / IP"        },
            { label: "Profile update",    value: "10 / min / IP"        },
            { label: "Withdrawal",        value: "5 / min / IP"         },
            { label: "Doc download",      value: "60 / min / IP"        },
            { label: "College writes",    value: "20 / min / IP"        },
            { label: "Course writes",     value: "30 / min / IP"        },
            { label: "Test email",        value: "10 / min / IP"        },
          ].map(({ label, value }) => (
            <div key={label} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-white/65 font-body text-xs font-mono">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
