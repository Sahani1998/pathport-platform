"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, Settings } from "lucide-react";

export type CookieConsent = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "pp-cookie-consent";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
}

function saveConsent(consent: CookieConsent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  localStorage.setItem(`${STORAGE_KEY}-ts`, new Date().toISOString());
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) setVisible(true);
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    saveConsent({ necessary: true, functional: true, analytics: true, marketing: true });
    setVisible(false);
  };

  const rejectAll = () => {
    saveConsent({ necessary: true, functional: false, analytics: false, marketing: false });
    setVisible(false);
  };

  const savePreferences = () => {
    saveConsent({ necessary: true, functional, analytics, marketing });
    setVisible(false);
  };

  if (showPreferences) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Cookie preferences">
        <div className="bg-navy-900 border border-white/[0.12] rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl text-white">Cookie preferences</h2>
            <button onClick={() => setShowPreferences(false)} className="text-white/40 hover:text-white/80 transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 mb-6">
            {[
              { label: "Strictly Necessary", desc: "Required for login and security. Cannot be disabled.", checked: true, disabled: true, onChange: undefined },
              { label: "Functional", desc: "Remembers your preferences (e.g. cookie consent settings).", checked: functional, disabled: false, onChange: setFunctional },
              { label: "Analytics", desc: "Helps PathPort understand how the platform is used. Not currently active.", checked: analytics, disabled: false, onChange: setAnalytics },
              { label: "Marketing", desc: "Not currently used by PathPort.", checked: marketing, disabled: false, onChange: setMarketing },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    disabled={item.disabled}
                    onChange={item.onChange ? (e) => item.onChange!(e.target.checked) : undefined}
                    className="w-4 h-4 rounded accent-[#c9a84c] disabled:opacity-50"
                  />
                </div>
                <div>
                  <p className="font-body font-semibold text-white/85 text-sm">{item.label} {item.disabled && <span className="text-white/30 font-normal">(required)</span>}</p>
                  <p className="text-white/45 font-body text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={savePreferences} className="flex-1 px-4 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
              Save preferences
            </button>
            <button onClick={acceptAll} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body text-sm font-bold hover:opacity-90 transition-all">
              Accept all
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6" role="dialog" aria-modal="true" aria-label="Cookie consent">
      <div className="max-w-3xl mx-auto bg-navy-900 border border-white/[0.12] rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <Cookie className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body font-semibold text-white/90 text-sm mb-1">PathPort uses cookies</p>
            <p className="text-white/55 font-body text-sm leading-relaxed">
              We use strictly necessary cookies for authentication. Optional cookies (functional, analytics) improve your experience. We do not use marketing cookies.{" "}
              <Link href="/legal/cookies" className="text-gold-400 hover:underline">Cookie Policy</Link>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={rejectAll} className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/60 font-body text-sm hover:border-white/[0.20] hover:text-white/80 transition-all">
            Reject optional
          </button>
          <button onClick={() => setShowPreferences(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/60 font-body text-sm hover:border-white/[0.20] hover:text-white/80 transition-all">
            <Settings className="w-3.5 h-3.5" /> Manage preferences
          </button>
          <button onClick={acceptAll} className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body text-sm font-bold hover:opacity-90 transition-all">
            Accept all cookies
          </button>
        </div>
      </div>
    </div>
  );
}
