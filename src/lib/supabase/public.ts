import { createClient } from "@supabase/supabase-js";

/**
 * Public (anon-key) Supabase client for reading data that's open to
 * everyone (e.g. regions, approved properties). Not for anything that
 * needs a logged-in user's session - that comes with the owner auth flow.
 */
export function createPublicSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
