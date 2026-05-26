import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * setAll uses REST spread  { name, value, ...options }  — same reason as
 * middleware: Supabase passes cookie attributes at the TOP LEVEL of each item,
 * not nested under an "options" key.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(
          cookiesToSet: Array<{ name: string; value: string; [key: string]: unknown }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, ...options }) =>
              cookieStore.set(
                name,
                value,
                options as Parameters<typeof cookieStore.set>[2]
              )
            );
          } catch {
            // Called from a Server Component where cookies() is read-only.
            // Middleware handles token refresh; this catch is intentional.
          }
        },
      },
    }
  );
}
