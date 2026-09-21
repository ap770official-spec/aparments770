import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type Region = {
  slug: string;
  name_he: string;
  name_en: string;
};

export async function getActiveRegions(): Promise<Region[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("regions")
    .select("slug, name_he, name_en")
    .eq("is_active", true)
    .order("name_he");

  if (error) {
    throw new Error(`Failed to load regions: ${error.message}`);
  }

  return data ?? [];
}
