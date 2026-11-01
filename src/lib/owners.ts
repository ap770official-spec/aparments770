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

export type OwnerRole = "owner" | "manager" | "other";
export type ReferralSource =
  | "friend"
  | "whatsapp"
  | "google"
  | "social"
  | "ad"
  | "other";

export const OWNER_ROLES: OwnerRole[] = ["owner", "manager", "other"];
export const REFERRAL_SOURCES: ReferralSource[] = [
  "friend",
  "whatsapp",
  "google",
  "social",
  "ad",
  "other",
];

export type OwnerProfile = {
  first_name: string | null;
  last_name: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  owner_role: OwnerRole | null;
  referral_source: ReferralSource | null;
  referral_other: string | null;
  terms_accepted_at: string | null;
  profile_completed_at: string | null;
};

const PROFILE_COLUMNS =
  "first_name, last_name, phone_country_code, phone_number, owner_role, referral_source, referral_other, terms_accepted_at, profile_completed_at";

export async function getOwnerProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<OwnerProfile | null> {
  const { data, error } = await supabase
    .from("owners")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load owner profile: ${error.message}`);
  }

  return data;
}
