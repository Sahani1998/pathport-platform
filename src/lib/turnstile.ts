// Cloudflare Turnstile server-side verification helper.
// Reads TURNSTILE_SECRET_KEY from env. If not set, verification is skipped
// (fail-open) so local dev and environments without the key still work.
// Production MUST set TURNSTILE_SECRET_KEY.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteip?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[Turnstile] TURNSTILE_SECRET_KEY not set — skipping verification");
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "Missing CAPTCHA token" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set("remoteip", remoteip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const json = await res.json() as { success: boolean; "error-codes"?: string[] };
    if (!json.success) {
      const code = json["error-codes"]?.[0] ?? "unknown";
      return { success: false, error: `CAPTCHA verification failed: ${code}` };
    }
    return { success: true };
  } catch (err) {
    console.error("[Turnstile] verification request failed:", err);
    // Fail-open on network errors so a Turnstile outage never blocks users.
    return { success: true };
  }
}
