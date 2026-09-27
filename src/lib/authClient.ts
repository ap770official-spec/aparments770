import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export async function signOut(): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  await supabase.auth.signOut();
}
