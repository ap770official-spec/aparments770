"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { geocodeAddress } from "@/lib/mapbox";
import { redirect } from "next/navigation";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

/**
 * One-time backfill: the two regions' landmark addresses were entered
 * as text at launch (stage א'), before Mapbox was wired up. Geocodes
 * whichever regions still have no landmark_lat/lng - safe to run
 * repeatedly, it only touches rows still missing coordinates.
 */
export async function geocodeRegions() {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  const { data: regions, error } = await supabase
    .from("regions")
    .select("id, landmark_address")
    .is("landmark_lat", null);
  if (error) throw new Error(error.message);

  for (const region of regions ?? []) {
    const result = await geocodeAddress(region.landmark_address);
    if (result) {
      await supabase
        .from("regions")
        .update({ landmark_lat: result.lat, landmark_lng: result.lng })
        .eq("id", region.id);
    }
  }

  revalidatePath("/admin/properties");
}

/**
 * One-time backfill for properties published before the map-based
 * location picker existed (their lat/lng is null). Best-effort
 * geocoding of the free-text address they were saved with - less
 * precise than the picker, but better than no coordinates. New
 * listings from now on already come with lat/lng from the picker, so
 * this only ever affects legacy rows.
 */
export async function geocodeLegacyProperties() {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, address")
    .is("lat", null);
  if (error) throw new Error(error.message);

  for (const property of properties ?? []) {
    const result = await geocodeAddress(property.address);
    if (result) {
      await supabase
        .from("properties")
        .update({ lat: result.lat, lng: result.lng })
        .eq("id", property.id);
    }
  }

  revalidatePath("/admin/properties");
}
