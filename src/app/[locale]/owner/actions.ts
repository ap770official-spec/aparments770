"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AvailabilityMode } from "@/lib/properties";

export async function updateAvailabilityMode(
  propertyId: string,
  mode: AvailabilityMode,
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("properties")
    .update({ availability_mode: mode })
    .eq("id", propertyId)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(`Failed to update availability: ${error.message}`);
  }
}
