import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client - bypasses RLS entirely. Server-only,
 * never import this into a Client Component or anything that could
 * ship it to the browser. Used exclusively by the /admin section.
 */
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
