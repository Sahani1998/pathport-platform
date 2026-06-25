"use client";

// Cloudflare Turnstile widget — renders the invisible CAPTCHA challenge and
// reports the token via `onToken`. Token must be submitted to the server in the
// `cf_turnstile_response` field; the server verifies it with `verifyTurnstileToken()`.
//
// Reads NEXT_PUBLIC_TURNSTILE_SITE_KEY from env. When not set, calls onToken("")
// once so submit buttons remain enabled in dev / environments without Turnstile
// configured (matches the server's fail-open behaviour).

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        opts: {
          sitekey:   string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?:    "light" | "dark" | "auto";
          size?:     "normal" | "compact" | "flexible";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  theme?: "light" | "dark" | "auto";
}

export default function TurnstileWidget({ onToken, theme = "auto" }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef  = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Inject the Turnstile script once per page.
  useEffect(() => {
    if (!siteKey) {
      onToken("");
      return;
    }
    if (window.turnstile) { setScriptReady(true); return; }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src   = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => setScriptReady(true), { once: true });
    document.head.appendChild(script);
  }, [siteKey, onToken]);

  // Render the widget once the script + container are both ready.
  useEffect(() => {
    if (!scriptReady || !siteKey || !containerRef.current || widgetIdRef.current) return;

    const id = window.turnstile!.render(containerRef.current, {
      sitekey:           siteKey,
      callback:          (token: string) => onToken(token),
      "error-callback":  () => onToken(""),
      "expired-callback": () => onToken(""),
      theme,
    });
    widgetIdRef.current = id;

    return () => {
      if (widgetIdRef.current) {
        try { window.turnstile?.remove(widgetIdRef.current); } catch { /* widget already gone */ }
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, siteKey, onToken, theme]);

  if (!siteKey) return null;
  return <div ref={containerRef} className="cf-turnstile" />;
}
