import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type PropertyPhoto = {
  url: string;
  sort_order: number;
  media_type: "image" | "video";
};

export type PropertyAmenity = {
  category: "general" | "shabbat_kosher" | "proximity";
  amenity_key: string;
};

export type ApprovalStatus = "pending_approval" | "approved" | "rejected";

export type AvailabilityMode =
  | "fully_locked"
  | "default_open_block_dates"
  | "default_closed_open_dates";

export type PropertySummary = {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
  price_per_night: number;
  bedrooms: number;
  beds: number;
  max_guests: number | null;
  approval_status: ApprovalStatus;
  availability_mode: AvailabilityMode;
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
  regions: {
    name_he: string;
    name_en: string;
    landmark_lat: number | null;
    landmark_lng: number | null;
  } | null;
};

const SUMMARY_COLUMNS =
  "id, address, lat, lng, price_per_night, bedrooms, beds, max_guests, approval_status, availability_mode, property_photos(url, sort_order, media_type)";

export function mainMedia(photos: PropertyPhoto[]): PropertyPhoto | null {
  if (photos.length === 0) return null;
  return [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];
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
    .select(SUMMARY_COLUMNS)
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
    .select(SUMMARY_COLUMNS)
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
      `id, address, lat, lng, price_per_night, bedrooms, beds, toilets, bathtubs,
       max_guests, min_nights, checkin_time, checkout_time, approval_status,
       availability_mode, phone_country_code, phone_number,
       description_he, description_en,
       property_photos(url, sort_order, media_type),
       property_amenities(category, amenity_key),
       regions(name_he, name_en, landmark_lat, landmark_lng)`,
    )
    .eq("id", id)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load property: ${error.message}`);
  }

  return data as unknown as PropertyDetail | null;
}

export type AdminPropertyDetail = PropertyDetail & {
  approval_status: ApprovalStatus;
  created_at: string;
  regions: { name_he: string } | null;
  owners: {
    full_name: string | null;
    subscription_expires_at: string | null;
    is_frozen: boolean;
  } | null;
};

/**
 * Full property record for the admin detail view - no approval_status
 * filter (admins need to see pending/rejected listings too), and
 * includes the owner's name and phone for direct contact. Must be
 * called with the service-role client (bypasses RLS by design).
 */
export async function getAdminPropertyById(
  supabase: SupabaseClient,
  id: string,
): Promise<AdminPropertyDetail | null> {
  const { data, error } = await supabase
    .from("properties")
    .select(
      `id, address, price_per_night, bedrooms, beds, toilets, bathtubs,
       max_guests, min_nights, checkin_time, checkout_time, approval_status,
       availability_mode, phone_country_code, phone_number, created_at,
       description_he, description_en,
       property_photos(url, sort_order, media_type),
       property_amenities(category, amenity_key),
       regions(name_he), owners(full_name, subscription_expires_at, is_frozen)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load property: ${error.message}`);
  }

  return data as AdminPropertyDetail | null;
}

export type PropertyForDuplication = {
  region_id: string;
  address: string;
  lat: number | null;
  lng: number | null;
  bedrooms: number;
  beds: number;
  toilets: number;
  bathtubs: number;
  price_per_night: number;
  phone_country_code: string;
  phone_number: string;
  checkin_time: string | null;
  checkout_time: string | null;
  max_guests: number | null;
  min_nights: number | null;
  description_he: string | null;
  description_en: string | null;
  property_amenities: PropertyAmenity[];
};

/**
 * Fetches a property's fields for prefilling the "new property" form
 * when duplicating - restricted to the caller's own listings (checked
 * via owner_id, on top of whatever RLS already enforces). Media isn't
 * included: a duplicate should get its own fresh photos, not reuse
 * another listing's.
 */
export async function getOwnerPropertyForDuplicate(
  supabase: SupabaseClient,
  id: string,
  ownerId: string,
): Promise<PropertyForDuplication | null> {
  const { data, error } = await supabase
    .from("properties")
    .select(
      `region_id, address, lat, lng, bedrooms, beds, toilets, bathtubs,
       price_per_night, phone_country_code, phone_number,
       checkin_time, checkout_time, max_guests, min_nights,
       description_he, description_en,
       property_amenities(category, amenity_key)`,
    )
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load property to duplicate: ${error.message}`);
  }

  return data;
}

export type NewPropertyInput = {
  ownerId: string;
  regionId: string;
  address: string;
  lat: number;
  lng: number;
  bedrooms: number;
  beds: number;
  toilets: number;
  bathtubs: number;
  pricePerNight: number;
  phoneCountryCode: string;
  phoneNumber: string;
  checkinTime: string | null;
  checkoutTime: string | null;
  maxGuests: number | null;
  minNights: number | null;
  descriptionHe: string | null;
  descriptionEn: string | null;
  descriptionSourceLang: "he" | "en" | null;
  amenities: { category: string; amenityKey: string }[];
  media: { url: string; mediaType: "image" | "video"; sortOrder: number }[];
};

/**
 * Creates a property plus its amenities and photos. Runs as three
 * sequential inserts (not one DB transaction) - acceptable for the
 * MVP's traffic level; a partial failure here just leaves an
 * incomplete-but-still-pending listing the owner can see and we can
 * clean up manually, not a public-facing problem since new listings
 * start as pending_approval.
 */
export async function createProperty(
  supabase: SupabaseClient,
  input: NewPropertyInput,
): Promise<string> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert({
      owner_id: input.ownerId,
      region_id: input.regionId,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      bedrooms: input.bedrooms,
      beds: input.beds,
      toilets: input.toilets,
      bathtubs: input.bathtubs,
      price_per_night: input.pricePerNight,
      phone_country_code: input.phoneCountryCode,
      phone_number: input.phoneNumber,
      checkin_time: input.checkinTime,
      checkout_time: input.checkoutTime,
      max_guests: input.maxGuests,
      min_nights: input.minNights,
      description_he: input.descriptionHe,
      description_en: input.descriptionEn,
      description_source_lang: input.descriptionSourceLang,
    })
    .select("id")
    .single();

  if (propertyError || !property) {
    throw new Error(
      `Failed to create property: ${propertyError?.message ?? "unknown error"}`,
    );
  }

  const propertyId = property.id as string;

  if (input.amenities.length > 0) {
    const { error: amenitiesError } = await supabase
      .from("property_amenities")
      .insert(
        input.amenities.map((a) => ({
          property_id: propertyId,
          category: a.category,
          amenity_key: a.amenityKey,
        })),
      );
    if (amenitiesError) {
      throw new Error(`Failed to save amenities: ${amenitiesError.message}`);
    }
  }

  if (input.media.length > 0) {
    const { error: photosError } = await supabase
      .from("property_photos")
      .insert(
        input.media.map((m) => ({
          property_id: propertyId,
          url: m.url,
          media_type: m.mediaType,
          sort_order: m.sortOrder,
        })),
      );
    if (photosError) {
      throw new Error(`Failed to save photos: ${photosError.message}`);
    }
  }

  return propertyId;
}
