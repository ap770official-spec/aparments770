import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type Region = {
  id: string;
  slug: string;
  name_he: string;
  name_en: string;
};

export async function getActiveRegions(): Promise<Region[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("regions")
    .select("id, slug, name_he, name_en")
    .eq("is_active", true)
    .order("name_he");

  if (error) {
    throw new Error(`Failed to load regions: ${error.message}`);
  }

  return data ?? [];
}

export async function getRegionBySlug(slug: string): Promise<Region | null> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("regions")
    .select("id, slug, name_he, name_en")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load region: ${error.message}`);
  }

  return data;
}

export function regionLabel(region: Pick<Region, "name_he" | "name_en">, locale: string) {
  return locale === "he" ? region.name_he : region.name_en;
}
