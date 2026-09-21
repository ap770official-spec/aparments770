import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type PropertyPhoto = {
  url: string;
  sort_order: number;
};

export type PropertyAmenity = {
  category: "general" | "shabbat_kosher" | "proximity";
  amenity_key: string;
};

export type PropertySummary = {
  id: string;
  address: string;
  price_per_night: number;
  bedrooms: number;
  beds: number;
  max_guests: number | null;
  property_photos: PropertyPhoto[];
};

export type PropertyDetail = PropertySummary & {
  toilets: number;
  bathtubs: number;
  phone_country_code: string;
  phone_number: string;
  checkin_time: string | null;
  checkout_time: string | null;
  min_nights: number | null;
  description_he: string | null;
  description_en: string | null;
  property_amenities: PropertyAmenity[];
};

export function mainPhotoUrl(photos: PropertyPhoto[]): string | null {
  if (photos.length === 0) return null;
  return [...photos].sort((a, b) => a.sort_order - b.sort_order)[0].url;
}

export async function searchProperties({
  regionId,
  guests,
}: {
  regionId: string;
  guests: number;
}): Promise<PropertySummary[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, address, price_per_night, bedrooms, beds, max_guests, property_photos(url, sort_order)",
    )
    .eq("region_id", regionId)
    .eq("approval_status", "approved")
    .or(`max_guests.is.null,max_guests.gte.${guests}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to search properties: ${error.message}`);
  }

  return data ?? [];
}

export async function getOwnerProperties(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<PropertySummary[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, address, price_per_night, bedrooms, beds, max_guests, property_photos(url, sort_order)",
    )
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load your properties: ${error.message}`);
  }

  return data ?? [];
}

export async function getPropertyById(
  id: string,
): Promise<PropertyDetail | null> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `id, address, price_per_night, bedrooms, beds, toilets, bathtubs,
       max_guests, min_nights, checkin_time, checkout_time,
       phone_country_code, phone_number,
       description_he, description_en,
       property_photos(url, sort_order),
       property_amenities(category, amenity_key)`,
    )
    .eq("id", id)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load property: ${error.message}`);
  }

  return data;
}
