import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates the owners row for a newly logged-in user if one doesn't
 * exist yet. There's no signup form - the first dashboard visit after
 * login is what creates the "owner card".
 */
export async function ensureOwnerRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from("owners")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to check owner: ${selectError.message}`);
  }

  if (existing) return;

  const { error: insertError } = await supabase
    .from("owners")
    .insert({ id: userId });

  if (insertError) {
    throw new Error(`Failed to create owner: ${insertError.message}`);
  }
}
