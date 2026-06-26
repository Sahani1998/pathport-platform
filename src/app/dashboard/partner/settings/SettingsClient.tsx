"use client";

import { useState } from "react";
import { Settings, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { Profile } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import GoldButton from "@/components/ui/GoldButton";

interface Props {
  profile: Profile;
}

export default function SettingsClient({ profile }: Props) {
  const { refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone]       = useState(profile.phone ?? "");
  const [country, setCountry]   = useState(profile.country ?? "");
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/partner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim(), country: country.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as Record<string,unknown>).error as string ?? "Failed to save");
      }

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-3 text-white/80 font-body text-sm placeholder-white/25 focus:outline-none focus:border-gold-400/50 focus:bg-white/[0.08] transition-all";
  const labelCls = "block text-white/50 font-body text-xs font-semibold uppercase tracking-wider mb-2";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
          <Settings className="w-7 h-7 text-gold-400" />
          Settings
        </h2>
        <p className="text-white/45 font-body text-sm">Manage your partner profile</p>
      </div>

      {/* Profile card */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-5">
        <h3 className="font-display text-xl text-white">Profile Information</h3>

        {/* Read-only: email */}
        <div>
          <label className={labelCls}>Email Address</label>
          <div className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white/40 font-body text-sm cursor-not-allowed">
            {profile.email}
          </div>
          <p className="text-white/25 font-body text-xs mt-1">Email cannot be changed. Contact PathPort support.</p>
        </div>

        {/* Read-only: role */}
        <div>
          <label className={labelCls}>Role</label>
          <div className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white/40 font-body text-sm cursor-not-allowed">
            Recruitment Partner
          </div>
        </div>

        {/* Editable: full name */}
        <div>
          <label className={labelCls}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            className={inputCls}
            maxLength={200}
          />
        </div>

        {/* Editable: phone */}
        <div>
          <label className={labelCls}>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+65 XXXX XXXX"
            className={inputCls}
            maxLength={30}
          />
        </div>

        {/* Editable: country */}
        <div>
          <label className={labelCls}>Country</label>
          <input
            type="text"
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="India"
            className={inputCls}
            maxLength={100}
          />
        </div>

        {/* Save button + feedback */}
        <div className="flex items-center gap-3 pt-2">
          <GoldButton
            variant="solid-gold"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              : <><Save className="w-3.5 h-3.5" /> Save Changes</>
            }
          </GoldButton>

          {success && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-body text-sm">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </span>
          )}

          {error && (
            <span className="flex items-center gap-1.5 text-red-400 font-body text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </span>
          )}
        </div>
      </div>

      {/* Account info card */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/50 font-body text-sm">Partner ID</span>
            <span className="font-mono text-white/40 text-xs">{profile.id.slice(0, 8)}…</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 font-body text-sm">Account Created</span>
            <span className="text-white/40 font-body text-sm">
              {new Date(profile.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Contact support */}
      <div className="bg-gradient-to-br from-gold-500/[0.08] to-transparent border border-gold-400/15 rounded-2xl p-5">
        <p className="font-display text-lg text-white mb-1">Need help?</p>
        <p className="text-white/40 font-body text-xs mb-3">
          For commission queries, student linking, or account changes — contact your PathPort manager.
        </p>
        <a
          href="https://wa.me/6583776492"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
        >
          💬 WhatsApp +65 8377 6492
        </a>
      </div>
    </div>
  );
}
