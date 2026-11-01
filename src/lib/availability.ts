import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvailabilityMode } from "@/lib/properties";

/**
 * Per-night exceptions to a listing's availability_mode (see
 * property_availability_dates in supabase/schema.sql). A date is the
 * check-in date of one night.
 */
export type AvailabilityStatus = "blocked" | "open";

export type AvailabilityDate = {
  property_id: string;
  date: string;
  status: AvailabilityStatus;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Whether a string is a real YYYY-MM-DD calendar date. */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Adds days to a YYYY-MM-DD date, in UTC so DST never shifts it. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The nights of a stay: every date from check-in up to (not incl.) check-out. */
export function stayNights(checkin: string, checkout: string): string[] {
  const nights: string[] = [];
  for (let date = checkin; date < checkout; date = addDays(date, 1)) {
    nights.push(date);
  }
  return nights;
}

/**
 * Whether a listing can be booked for every one of the given nights,
 * given its mode and its exception dates (date -> status).
 */
export function isAvailableForNights(
  mode: AvailabilityMode,
  exceptions: Map<string, AvailabilityStatus>,
  nights: string[],
): boolean {
  if (mode === "fully_locked") return false;
  if (mode === "default_open_block_dates") {
    return nights.every((night) => exceptions.get(night) !== "blocked");
  }
  return nights.every((night) => exceptions.get(night) === "open");
}

/** Exception dates for the given listings within [from, to). */
export async function getAvailabilityDates(
  supabase: SupabaseClient,
  propertyIds: string[],
  from: string,
  to: string,
): Promise<AvailabilityDate[]> {
  if (propertyIds.length === 0) return [];

  const { data, error } = await supabase
    .from("property_availability_dates")
    .select("property_id, date, status")
    .in("property_id", propertyIds)
    .gte("date", from)
    .lt("date", to);

  if (error) {
    throw new Error(`Failed to load availability: ${error.message}`);
  }

  return data ?? [];
}

/** Groups exception rows into property id -> (date -> status). */
export function groupAvailability(
  rows: AvailabilityDate[],
): Map<string, Map<string, AvailabilityStatus>> {
  const byProperty = new Map<string, Map<string, AvailabilityStatus>>();
  for (const row of rows) {
    let dates = byProperty.get(row.property_id);
    if (!dates) {
      dates = new Map();
      byProperty.set(row.property_id, dates);
    }
    dates.set(row.date, row.status);
  }
  return byProperty;
}
