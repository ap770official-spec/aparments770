import type { PropertySummary } from "@/lib/properties";

/**
 * Listing addresses are Mapbox place names, e.g.
 * "1234 President Street, Brooklyn, New York 11213, United States".
 * Every listing is in the same neighborhood, so the tail is noise on a
 * card. Keeps the first `parts` comma-separated segments.
 */
export function shortAddress(address: string, parts = 1): string {
  const segments = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 0) return address;
  return segments.slice(0, parts).join(", ");
}

// next-intl's translator, narrowed to what these helpers call. Works with
// both useTranslations("property") and getTranslations("property").
type PropertyTranslator = (
  key: "listingTitle" | "factType_apartment" | "factType_house" | "factType_basement" | "capacityLine" | "bedsOnlyLine",
  values?: Record<string, string | number>,
) => string;

type ListingFields = Pick<
  PropertySummary,
  "property_type" | "bedrooms" | "beds" | "max_guests"
>;

/** "Apartment in a building · 3 bedrooms" - the card/page headline. */
export function listingTitle(t: PropertyTranslator, property: ListingFields) {
  return t("listingTitle", {
    type: t(`factType_${property.property_type}`),
    rooms: property.bedrooms,
  });
}

/** "Up to 6 guests · 4 beds" - capacity under the headline. */
export function capacityLine(t: PropertyTranslator, property: ListingFields) {
  return property.max_guests !== null
    ? t("capacityLine", { guests: property.max_guests, beds: property.beds })
    : t("bedsOnlyLine", { beds: property.beds });
}
