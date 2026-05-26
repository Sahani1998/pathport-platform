import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Uses the individual get/set/remove cookie adapter — identical logic to the
 * middleware client — so getUser() reads the session via the same direct
 * name-based lookup that middleware already confirmed works.
 *
 * set/remove are wrapped in try/catch because Server Components cannot write
 * cookies (read-only).  Middleware handles all token refresh writes.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Direct lookup — same pattern that made middleware work
        get(name: string) {
          return cookieStore.get(name)?.value;
        },

        // Server Components are read-only; swallow the error.
        // Middleware is responsible for writing refreshed tokens.
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(
              name,
              value,
              options as Parameters<typeof cookieStore.set>[2]
            );
          } catch {
            // intentional — Server Component context
          }
        },

        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(
              name,
              "",
              options as Parameters<typeof cookieStore.set>[2]
            );
          } catch {
            // intentional — Server Component context
          }
        },
      },
    }
  );
}
