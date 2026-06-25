"use client";

// MFA enrollment and verification component (Supabase TOTP).
// Rendered on /dashboard/admin/settings/mfa and /dashboard/institution/settings/mfa.
// Supports: enroll (show QR), verify enrollment, unenroll.

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Factor = {
  id: string;
  factor_type: string;
  friendly_name?: string;
  status: string;
};

type Phase = "loading" | "unenrolled" | "enrolling" | "enrolled";

export default function MfaSetup() {
  const supabase = createClient();
  const [phase, setPhase]       = useState<Phase>("loading");
  const [factors, setFactors]   = useState<Factor[]>([]);
  const [qr, setQr]             = useState<string | null>(null);
  const [secret, setSecret]     = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode]         = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const loadFactors = useCallback(async () => {
    const { data, error: err } = await supabase.auth.mfa.listFactors();
    if (err) { setError(err.message); return; }
    const active = (data?.totp ?? []) as Factor[];
    setFactors(active);
    setPhase(active.some(f => f.status === "verified") ? "enrolled" : "unenrolled");
  }, [supabase]);

  useEffect(() => { loadFactors(); }, [loadFactors]);

  async function startEnroll() {
    setError(null);
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator App" });
    if (err || !data) { setError(err?.message ?? "Enroll failed"); return; }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
    setPhase("enrolling");
  }

  async function verifyEnroll() {
    setError(null);
    if (!factorId) return;
    const challengeRes = await supabase.auth.mfa.challenge({ factorId });
    if (challengeRes.error) { setError(challengeRes.error.message); return; }
    const verifyRes = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeRes.data.id,
      code: code.trim(),
    });
    if (verifyRes.error) { setError("Invalid code — try again"); return; }
    setSuccess("MFA enabled successfully. Use your authenticator app on next login.");
    await loadFactors();
  }

  async function unenroll(fId: string) {
    setError(null);
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId: fId });
    if (err) { setError(err.message); return; }
    setSuccess("MFA removed.");
    await loadFactors();
  }

  if (phase === "loading") {
    return <p className="text-sm text-gray-500">Loading MFA status…</p>;
  }

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
        <p className="mt-1 text-sm text-gray-600">
          Use an authenticator app (Google Authenticator, Authy, 1Password) for an extra layer of security.
        </p>
      </div>

      {error   && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">{success}</p>}

      {phase === "enrolled" && (
        <div className="space-y-3">
          <p className="text-sm text-green-700 font-medium">✓ MFA is active</p>
          {factors.filter(f => f.status === "verified").map(f => (
            <div key={f.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
              <span className="text-sm">{f.friendly_name ?? "Authenticator App"}</span>
              <button
                onClick={() => unenroll(f.id)}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {phase === "unenrolled" && (
        <button
          onClick={startEnroll}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          Enable MFA
        </button>
      )}

      {phase === "enrolling" && qr && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Scan the QR code with your authenticator app:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="MFA QR Code" className="w-48 h-48 border rounded-lg" />
          {secret && (
            <p className="text-xs text-gray-500 font-mono break-all">
              Manual key: {secret}
            </p>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter the 6-digit code from your app
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <div className="flex gap-3">
              <button
                onClick={verifyEnroll}
                disabled={code.length !== 6}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Verify &amp; Enable
              </button>
              <button
                onClick={() => { setPhase("unenrolled"); setQr(null); setCode(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
