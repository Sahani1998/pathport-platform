// Tests for Cloudflare Turnstile server-side verification.
// External fetch is NOT called — tests verify the helper's behaviour when
// the secret key is absent (fail-open) and when the token is missing.

import { verifyTurnstileToken } from "@/lib/turnstile";

describe("verifyTurnstileToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns success=true when TURNSTILE_SECRET_KEY is not set (fail-open for dev)", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const result = await verifyTurnstileToken("any-token");
    expect(result.success).toBe(true);
  });

  it("returns success=false with error message when token is missing and key is set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x-test-secret";
    const result = await verifyTurnstileToken(null);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing captcha token/i);
  });

  it("returns success=false for empty string token when key is set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x-test-secret";
    const result = await verifyTurnstileToken("");
    expect(result.success).toBe(false);
  });
});
