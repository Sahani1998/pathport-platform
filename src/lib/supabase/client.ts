import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components.
 *
 * IMPORTANT: returns a single shared (singleton) browser client.
 *
 * Supabase's auth layer (GoTrue) serialises token access through a single
 * Web Lock keyed on the storage key. Creating a fresh client on every call
 * spins up multiple GoTrueClient instances that all contend for that same
 * lock — Supabase explicitly warns this "may produce undefined behavior when
 * used concurrently under the same storage key." In practice it manifests as
 * queries that never resolve: e.g. the admin Public Content overview fires six
 * count queries at once (one per card), and with six separate clients every
 * one of them stalls until the 10 s timeout fires. Sharing one instance means
 * one lock holder and no contention.
 *
 * Falls back to placeholder values when env vars are absent (build time / CI
 * without Vercel secrets) so that AuthProvider's useState initializer doesn't
 * throw during SSR. useEffect — where actual Supabase calls happen — never
 * runs during SSR, so the placeholder client is never used for real requests.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? "https://placeholder.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  // On the server (SSR / RSC) never memoise: a module-level instance would be
  // shared across requests. Client components only issue real queries in the
  // browser, so the server path here is effectively the SSR-safe placeholder.
  if (typeof window === "undefined") {
    return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  }

  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return browserClient;
}
