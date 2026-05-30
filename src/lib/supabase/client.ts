import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components.
 *
 * Falls back to placeholder values when env vars are absent (build time / CI
 * without Vercel secrets) so that AuthProvider's useState initializer doesn't
 * throw during SSR.  useEffect — where actual Supabase calls happen — never
 * runs during SSR, so the placeholder client is never used for real requests.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL      ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
  );
}
