import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client that reads the logged-in user's session
 * from cookies. Use this in Server Components, Server Actions and Route
 * Handlers - never in Client Components (use browser.ts there instead).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render, where cookies can't
            // be written. The proxy (see src/proxy.ts) refreshes the
            // session cookie instead, so this is safe to ignore.
          }
        },
      },
    },
  );
}
