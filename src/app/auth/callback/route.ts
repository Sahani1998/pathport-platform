import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the Supabase auth callback (email confirmation, OAuth, password reset).
 * Supabase redirects back here with a `code` param; we exchange it for a session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code     = searchParams.get("code");
  const next     = searchParams.get("next") ?? "/dashboard";
  const errorMsg = searchParams.get("error_description");

  if (errorMsg) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication+failed`);
}
