"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { geocodeAddress, getWalkingDirections } from "@/lib/mapbox";
import { AMENITY_GROUPS } from "@/lib/amenities";
import type { PropertyType } from "@/lib/properties";

const PROPERTY_TYPES: PropertyType[] = ["apartment", "house", "basement"];

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, name: string): string | null {
  return text(formData, name) || null;
}

/** Whole number in [min, max], or null when the field was left empty. */
function optionalInt(
  formData: FormData,
  name: string,
  min: number,
  max: number,
): number | null | "invalid" {
  const raw = text(formData, name);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : "invalid";
}

type MediaItem = { url: string; mediaType: "image" | "video" };

function parseMedia(raw: string): MediaItem[] | null {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return null;
    const items: MediaItem[] = [];
    for (const item of parsed) {
      if (
        typeof item?.url !== "string" ||
        !item.url.startsWith("https://") ||
        (item.mediaType !== "image" && item.mediaType !== "video")
      ) {
        return null;
      }
      items.push({ url: item.url, mediaType: item.mediaType });
    }
    return items;
  } catch {
    return null;
  }
}

/**
 * Saves the admin's edits to a listing - every field the owner fills
 * in when publishing, plus amenities and media (order included; the
 * first item is the main photo). Doesn't touch approval status or the
 * owner's subscription, those stay with the approve/reject actions.
 *
 * If the address text changed (or the listing has no coordinates yet,
 * e.g. one published before the map picker existed), it's geocoded so
 * the map pin and walking time follow it. When Mapbox can't find the new address the
 * old coordinates are kept (better a slightly-off pin than dropping
 * the listing off the map) and the admin is told so.
 *
 * Like createProperty, these are sequential writes rather than one
 * transaction - acceptable at this scale for a single admin.
 */
export async function updatePropertyAsAdmin(
  propertyId: string,
  formData: FormData,
) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const editHref = `/admin/properties/${propertyId}/edit`;
  const fail = (code: string) => redirect(`${editHref}?error=${code}`);

  const address = text(formData, "address");
  if (!address) fail("address");

  const propertyType = text(formData, "propertyType") as PropertyType;
  if (!PROPERTY_TYPES.includes(propertyType)) fail("generic");

  const price = Number(text(formData, "pricePerNight"));
  if (!Number.isFinite(price) || price <= 0) fail("price");

  const phoneCountryCode = text(formData, "phoneCountryCode");
  const phoneNumber = text(formData, "phoneNumber").replace(/[^\d]/g, "");
  if (!phoneCountryCode || !phoneNumber) fail("phone");

  const counts = {
    bedrooms: optionalInt(formData, "bedrooms", 0, 30),
    beds: optionalInt(formData, "beds", 0, 30),
    toilets: optionalInt(formData, "toilets", 0, 30),
    bathtubs: optionalInt(formData, "bathtubs", 0, 30),
    maxGuests: optionalInt(formData, "maxGuests", 1, 99),
    minNights: optionalInt(formData, "minNights", 1, 365),
  };
  if (Object.values(counts).includes("invalid")) fail("numbers");

  const media = parseMedia(text(formData, "media"));
  if (!media) fail("generic");

  const selectedAmenities = new Set(formData.getAll("amenities"));
  const amenityRows = AMENITY_GROUPS.flatMap((group) =>
    group.keys
      .filter((key) => selectedAmenities.has(key))
      .map((key) => ({
        property_id: propertyId,
        category: group.category,
        amenity_key: key,
      })),
  );

  const supabase = createAdminSupabaseClient();

  const { data: current, error: currentError } = await supabase
    .from("properties")
    .select("address, lat, lng, regions(landmark_lat, landmark_lng)")
    .eq("id", propertyId)
    .maybeSingle();
  if (currentError) throw new Error(currentError.message);
  if (!current) redirect("/admin/properties");

  let location: {
    lat: number | null;
    lng: number | null;
    walking_minutes_to_landmark?: number | null;
  } = { lat: current.lat, lng: current.lng };
  let geocodeFailed = false;

  if (address !== current.address || current.lat == null || current.lng == null) {
    const found = await geocodeAddress(address).catch(() => null);
    if (found) {
      const landmark = current.regions as unknown as {
        landmark_lat: number | null;
        landmark_lng: number | null;
      } | null;
      const walking =
        landmark?.landmark_lat != null && landmark?.landmark_lng != null
          ? await getWalkingDirections({
              from: found,
              to: { lat: landmark.landmark_lat, lng: landmark.landmark_lng },
            })
          : null;
      location = {
        lat: found.lat,
        lng: found.lng,
        walking_minutes_to_landmark: walking?.minutes ?? null,
      };
    } else {
      geocodeFailed = true;
    }
  }

  const { error: updateError } = await supabase
    .from("properties")
    .update({
      address,
      ...location,
      address_notes: optionalText(formData, "addressNotes"),
      property_type: propertyType,
      bedrooms: counts.bedrooms ?? 0,
      beds: counts.beds ?? 0,
      toilets: counts.toilets ?? 0,
      bathtubs: counts.bathtubs ?? 0,
      max_guests: counts.maxGuests,
      min_nights: counts.minNights,
      price_per_night: price,
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
      checkin_time: optionalText(formData, "checkinTime"),
      checkout_time: optionalText(formData, "checkoutTime"),
      description_he: optionalText(formData, "descriptionHe"),
      description_en: optionalText(formData, "descriptionEn"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);
  if (updateError) throw new Error(updateError.message);

  const { error: deleteAmenitiesError } = await supabase
    .from("property_amenities")
    .delete()
    .eq("property_id", propertyId);
  if (deleteAmenitiesError) throw new Error(deleteAmenitiesError.message);
  if (amenityRows.length > 0) {
    const { error } = await supabase.from("property_amenities").insert(amenityRows);
    if (error) throw new Error(error.message);
  }

  const { error: deletePhotosError } = await supabase
    .from("property_photos")
    .delete()
    .eq("property_id", propertyId);
  if (deletePhotosError) throw new Error(deletePhotosError.message);
  if (media!.length > 0) {
    const { error } = await supabase.from("property_photos").insert(
      media!.map((m, index) => ({
        property_id: propertyId,
        url: m.url,
        media_type: m.mediaType,
        sort_order: index,
      })),
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/[locale]/property/[id]", "page");
  revalidatePath("/[locale]/search", "page");

  redirect(
    `/admin/properties/${propertyId}?saved=1${geocodeFailed ? "&geo=0" : ""}`,
  );
}
