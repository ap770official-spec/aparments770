import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Registered as the Google OAuth redirect URI (via Supabase). Kept
// outside src/app/[locale] and excluded from the proxy's matcher
// (see src/proxy.ts) since this exact path is what's configured with
// Google/Supabase - it must not get a locale prefix.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/he/owner/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/he/owner/login?error=auth`);
}
