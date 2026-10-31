import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type Region = {
  id: string;
  slug: string;
  name_he: string;
  name_en: string;
  landmark_lat: number | null;
  landmark_lng: number | null;
};

export async function getActiveRegions(): Promise<Region[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("regions")
    .select("id, slug, name_he, name_en, landmark_lat, landmark_lng")
    .eq("is_active", true)
    .order("name_he");

  if (error) {
    throw new Error(`Failed to load regions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * The site currently operates a single region (Crown Heights) - "The
 * Ohel" sits in this table too but is meant to stay inactive until the
 * business deliberately reopens it. Call sites that need *a* region with
 * no explicit choice (a new listing, the homepage on a first visit with
 * no ?region= yet) must use this instead of taking regions[0] from
 * getActiveRegions(): that list is alphabetical, and "האוהל" sorts
 * before "קראון הייטס" in Hebrew, so the moment a second region is
 * active again, regions[0] silently stops being Crown Heights.
 */
export async function getDefaultRegion(): Promise<Region | null> {
  return getRegionBySlug("crown-heights");
}

export async function getRegionBySlug(slug: string): Promise<Region | null> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("regions")
    .select("id, slug, name_he, name_en, landmark_lat, landmark_lng")
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
