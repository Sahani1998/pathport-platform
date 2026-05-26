import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components.
 *
 * Must use the same NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * as the server/middleware clients — mismatched keys = getUser() returns null.
 */
export function createClient() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL    ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Log to browser console so you can compare with Vercel middleware logs.
  // Remove these after confirming both sides use the same project.
  console.log("[SupabaseClient] URL:", url);
  console.log("[SupabaseClient] KEY prefix:", anonKey.slice(0, 15));

  return createBrowserClient(url, anonKey);
}
