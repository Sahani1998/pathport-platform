// HMAC-signed unsubscribe tokens so the link cannot be guessed and so we can
// validate the email in the URL has not been tampered with.
//
// Token format: base64url(payload).base64url(signature)
//   payload   = JSON { e: email, i: issued_at }
//   signature = HMAC-SHA256(payload, EMAIL_UNSUBSCRIBE_SECRET)
//
// Tokens are valid for 90 days. If the secret rotates, old tokens silently
// reject (treated as invalid) — the user can request a fresh email to
// re-unsubscribe.

const ALGO = "SHA-256";
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function b64urlEncode(bytes: Uint8Array): string {
  let str = "";
  bytes.forEach(b => { str += String.fromCharCode(b); });
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(s: string): ArrayBuffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const norm = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(norm);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: ALGO },
    false,
    ["sign", "verify"],
  );
}

export async function signUnsubscribeToken(email: string, issuedAt: number): Promise<string> {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("EMAIL_UNSUBSCRIBE_SECRET not configured");

  const payload = JSON.stringify({ e: email.toLowerCase().trim(), i: issuedAt });
  const payloadB64 = b64urlEncode(new TextEncoder().encode(payload));

  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = b64urlEncode(new Uint8Array(sig));

  return `${payloadB64}.${sigB64}`;
}

export interface TokenVerifyResult {
  valid: boolean;
  email?: string;
  reason?: string;
}

export async function verifyUnsubscribeToken(token: string | null): Promise<TokenVerifyResult> {
  if (!token) return { valid: false, reason: "missing_token" };
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (!secret) return { valid: false, reason: "server_not_configured" };

  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "malformed" };
  const [payloadB64, sigB64] = parts;

  try {
    const key   = await importKey(secret);
    const sig   = b64urlDecode(sigB64);
    const valid = await crypto.subtle.verify(
      "HMAC", key, sig, new TextEncoder().encode(payloadB64),
    );
    if (!valid) return { valid: false, reason: "bad_signature" };

    const decoded = new TextDecoder().decode(b64urlDecode(payloadB64));
    const data    = JSON.parse(decoded) as { e: string; i: number };
    if (!data.e || typeof data.i !== "number") {
      return { valid: false, reason: "malformed_payload" };
    }
    const ageMs = Date.now() - data.i;
    if (ageMs > NINETY_DAYS_MS) return { valid: false, reason: "expired" };

    return { valid: true, email: data.e };
  } catch {
    return { valid: false, reason: "verify_exception" };
  }
}
