import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type PropertyPhoto = {
  url: string;
  sort_order: number;
  media_type: "image" | "video";
};

export type PropertyAmenity = {
  category:
    | "kitchen"
    | "climate"
    | "bathroom"
    | "safety"
    | "family"
    | "outdoor"
    | "shabbat_kosher"
    | "proximity";
  amenity_key: string;
};

export type PropertyType = "apartment" | "house" | "basement";

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
  property_type: PropertyType;
  price_per_night: number;
  bedrooms: number;
  beds: number;
  max_guests: number | null;
  walking_minutes_to_landmark: number | null;
  phone_country_code: string;
  phone_number: string;
  approval_status: ApprovalStatus;
  availability_mode: AvailabilityMode;
  listing_expires_at: string | null;
  property_photos: PropertyPhoto[];
};

export type PropertyDetail = PropertySummary & {
  toilets: number;
  bathtubs: number;
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
  "id, address, lat, lng, property_type, price_per_night, bedrooms, beds, max_guests, walking_minutes_to_landmark, phone_country_code, phone_number, approval_status, availability_mode, listing_expires_at, property_photos(url, sort_order, media_type)";

/**
 * PostgREST filter for "listing hasn't expired": an approved listing is
 * only shown publicly until its listing_expires_at (set by the admin on
 * approval). Null = no end date (legacy rows). RLS enforces the same
 * rule for anonymous visitors; this also covers a logged-in owner
 * browsing the site, whom RLS lets see their own expired listings.
 */
function notExpiredFilter(): string {
  return `listing_expires_at.is.null,listing_expires_at.gt.${new Date().toISOString()}`;
}

/** Whether an approved listing is past its listing_expires_at. */
export function isListingExpired(
  listingExpiresAt: string | null,
  now = new Date(),
): boolean {
  return listingExpiresAt != null && new Date(listingExpiresAt) <= now;
}

export function mainMedia(photos: PropertyPhoto[]): PropertyPhoto | null {
  if (photos.length === 0) return null;
  return [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];
}

export async function searchProperties({
  regionId,
  guests,
  maxWalkingMinutes,
}: {
  regionId: string;
  guests: number;
  maxWalkingMinutes?: number;
}): Promise<PropertySummary[]> {
  const supabase = createPublicSupabaseClient();
  let query = supabase
    .from("properties")
    .select(SUMMARY_COLUMNS)
    .eq("region_id", regionId)
    .eq("approval_status", "approved")
    .or(notExpiredFilter())
    .or(`max_guests.is.null,max_guests.gte.${guests}`);

  if (maxWalkingMinutes != null) {
    // Listings with no computed walking time (older ones, or created
    // before Mapbox was reachable) stay visible under any distance filter
    // rather than silently disappearing for missing data.
    query = query.or(
      `walking_minutes_to_landmark.is.null,walking_minutes_to_landmark.lte.${maxWalkingMinutes}`,
    );
  }

  const { data, error } = await query
    .order("walking_minutes_to_landmark", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to search properties: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Looks up approved properties by id for the anonymous, device-local
 * favorites list (see src/lib/favorites.ts) - favorites are just ids in
 * localStorage, so viewing them means re-fetching current data rather
 * than trusting stale client-side copies.
 */
export async function getPropertiesByIds(
  ids: string[],
): Promise<PropertySummary[]> {
  if (ids.length === 0) return [];

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("properties")
    .select(SUMMARY_COLUMNS)
    .in("id", ids)
    .eq("approval_status", "approved")
    .or(notExpiredFilter());

  if (error) {
    throw new Error(`Failed to load favorite properties: ${error.message}`);
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
      `id, address, lat, lng, property_type, price_per_night, bedrooms, beds, toilets, bathtubs,
       max_guests, min_nights, checkin_time, checkout_time, approval_status,
       availability_mode, phone_country_code, phone_number,
       description_he, description_en,
       property_photos(url, sort_order, media_type),
       property_amenities(category, amenity_key),
       regions(name_he, name_en, landmark_lat, landmark_lng)`,
    )
    .eq("id", id)
    .eq("approval_status", "approved")
    .or(notExpiredFilter())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load property: ${error.message}`);
  }

  return data as unknown as PropertyDetail | null;
}

export type AdminPropertyDetail = PropertyDetail & {
  owner_id: string;
  region_id: string;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  address_notes: string | null;
  description_source_lang: "he" | "en" | null;
  regions: {
    name_he: string;
    landmark_lat: number | null;
    landmark_lng: number | null;
  } | null;
  owners: {
    full_name: string | null;
    phone_country_code: string | null;
    phone_number: string | null;
    owner_role: string | null;
    referral_source: string | null;
    referral_other: string | null;
    terms_accepted_at: string | null;
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
      `id, owner_id, region_id, address, lat, lng, address_notes, walking_minutes_to_landmark,
       property_type, price_per_night, bedrooms, beds, toilets, bathtubs,
       max_guests, min_nights, checkin_time, checkout_time, approval_status,
       availability_mode, listing_expires_at, phone_country_code, phone_number,
       created_at, updated_at,
       description_he, description_en, description_source_lang,
       property_photos(url, sort_order, media_type),
       property_amenities(category, amenity_key),
       regions(name_he, landmark_lat, landmark_lng), owners(full_name, phone_country_code, phone_number, owner_role, referral_source, referral_other, terms_accepted_at)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load property: ${error.message}`);
  }

  return data as AdminPropertyDetail | null;
}

export type PropertyForEdit = {
  id: string;
  approval_status: ApprovalStatus;
  region_id: string;
  address: string;
  lat: number | null;
  lng: number | null;
  walking_minutes_to_landmark: number | null;
  property_type: PropertyType;
  address_notes: string | null;
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
  description_source_lang: "he" | "en" | null;
  property_amenities: PropertyAmenity[];
  property_photos: PropertyPhoto[];
};

/**
 * Fetches a property's fields, amenities and media for prefilling the
 * property form in edit mode - restricted to the caller's own listings
 * (checked via owner_id, on top of whatever RLS already enforces).
 */
export async function getOwnerPropertyForEdit(
  supabase: SupabaseClient,
  id: string,
  ownerId: string,
): Promise<PropertyForEdit | null> {
  const { data, error } = await supabase
    .from("properties")
    .select(
      `id, approval_status, region_id, address, lat, lng, walking_minutes_to_landmark, property_type, address_notes,
       bedrooms, beds, toilets, bathtubs,
       price_per_night, phone_country_code, phone_number,
       checkin_time, checkout_time, max_guests, min_nights,
       description_he, description_en, description_source_lang,
       property_amenities(category, amenity_key),
       property_photos(url, sort_order, media_type)`,
    )
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load property to edit: ${error.message}`);
  }

  return data;
}

export type NewPropertyInput = {
  ownerId: string;
  regionId: string;
  address: string;
  lat: number;
  lng: number;
  propertyType: PropertyType;
  addressNotes: string | null;
  walkingMinutesToLandmark: number | null;
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
    .insert({ owner_id: input.ownerId, ...propertyRow(input) })
    .select("id")
    .single();

  if (propertyError || !property) {
    throw new Error(
      `Failed to create property: ${propertyError?.message ?? "unknown error"}`,
    );
  }

  const propertyId = property.id as string;
  await insertAmenitiesAndMedia(supabase, propertyId, input);
  return propertyId;
}

/**
 * Updates a property and replaces its amenities and media with the
 * given lists. Like createProperty, these are sequential writes rather
 * than one transaction. approval_status is left untouched unless
 * resubmit is set, which sends a rejected listing back for review.
 *
 * Owners call this directly only for listings that aren't live yet;
 * edits to an approved listing go through submitPropertyEdit and are
 * applied here by the admin on approval.
 */
export async function updateProperty(
  supabase: SupabaseClient,
  propertyId: string,
  input: NewPropertyInput,
  { resubmit = false }: { resubmit?: boolean } = {},
): Promise<void> {
  const { error: propertyError } = await supabase
    .from("properties")
    .update({
      ...propertyRow(input),
      ...(resubmit ? { approval_status: "pending_approval" } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId)
    .eq("owner_id", input.ownerId);

  if (propertyError) {
    throw new Error(`Failed to update property: ${propertyError.message}`);
  }

  const { error: amenitiesDeleteError } = await supabase
    .from("property_amenities")
    .delete()
    .eq("property_id", propertyId);
  if (amenitiesDeleteError) {
    throw new Error(
      `Failed to clear amenities: ${amenitiesDeleteError.message}`,
    );
  }

  const { error: photosDeleteError } = await supabase
    .from("property_photos")
    .delete()
    .eq("property_id", propertyId);
  if (photosDeleteError) {
    throw new Error(`Failed to clear photos: ${photosDeleteError.message}`);
  }

  await insertAmenitiesAndMedia(supabase, propertyId, input);
}

function propertyRow(input: NewPropertyInput) {
  return {
    region_id: input.regionId,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    property_type: input.propertyType,
    address_notes: input.addressNotes,
    walking_minutes_to_landmark: input.walkingMinutesToLandmark,
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
  };
}

async function insertAmenitiesAndMedia(
  supabase: SupabaseClient,
  propertyId: string,
  input: NewPropertyInput,
): Promise<void> {
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
}

export type PropertyEditPayload = Omit<NewPropertyInput, "ownerId">;

export type PropertyEdit = {
  id: string;
  property_id: string;
  owner_id: string;
  payload: PropertyEditPayload;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

/**
 * Queues an owner's edit to an approved listing for admin review,
 * replacing any edit already pending for that property. The live
 * listing is not touched until the admin approves.
 */
export async function submitPropertyEdit(
  supabase: SupabaseClient,
  propertyId: string,
  input: NewPropertyInput,
): Promise<void> {
  const { ownerId, ...payload } = input;

  const { error: deleteError } = await supabase
    .from("property_edits")
    .delete()
    .eq("property_id", propertyId)
    .eq("status", "pending");
  if (deleteError) {
    throw new Error(`Failed to replace pending edit: ${deleteError.message}`);
  }

  const { error: insertError } = await supabase.from("property_edits").insert({
    property_id: propertyId,
    owner_id: ownerId,
    payload,
  });
  if (insertError) {
    throw new Error(`Failed to submit edit: ${insertError.message}`);
  }
}

export async function getPendingPropertyEdit(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<PropertyEdit | null> {
  const { data, error } = await supabase
    .from("property_edits")
    .select("id, property_id, owner_id, payload, status, created_at")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load pending edit: ${error.message}`);
  }

  return data;
}

/**
 * IDs of properties with an edit awaiting review. Pass ownerId to limit
 * to one owner's listings (the owner dashboard); omit it for admin use.
 */
export async function getPendingEditPropertyIds(
  supabase: SupabaseClient,
  ownerId?: string,
): Promise<Set<string>> {
  let query = supabase
    .from("property_edits")
    .select("property_id")
    .eq("status", "pending");
  if (ownerId) query = query.eq("owner_id", ownerId);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load pending edits: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.property_id as string));
}

/**
 * Overlays a pending edit onto the live listing, so the edit form shows
 * the owner what they last submitted rather than the approved version.
 */
export function withPendingEdit(
  property: PropertyForEdit,
  payload: PropertyEditPayload,
): PropertyForEdit {
  return {
    ...property,
    region_id: payload.regionId,
    address: payload.address,
    lat: payload.lat,
    lng: payload.lng,
    walking_minutes_to_landmark: payload.walkingMinutesToLandmark,
    property_type: payload.propertyType,
    address_notes: payload.addressNotes,
    bedrooms: payload.bedrooms,
    beds: payload.beds,
    toilets: payload.toilets,
    bathtubs: payload.bathtubs,
    price_per_night: payload.pricePerNight,
    phone_country_code: payload.phoneCountryCode,
    phone_number: payload.phoneNumber,
    checkin_time: payload.checkinTime,
    checkout_time: payload.checkoutTime,
    max_guests: payload.maxGuests,
    min_nights: payload.minNights,
    description_he: payload.descriptionHe,
    description_en: payload.descriptionEn,
    description_source_lang: payload.descriptionSourceLang,
    property_amenities: payload.amenities.map((a) => ({
      category: a.category as PropertyAmenity["category"],
      amenity_key: a.amenityKey,
    })),
    property_photos: payload.media.map((m) => ({
      url: m.url,
      media_type: m.mediaType,
      sort_order: m.sortOrder,
    })),
  };
}
