const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Server-side geocoding (free-text address -> coordinates), used only
 * by the one-time admin backfill tools - regular owner-facing
 * publishing now captures lat/lng directly from the map picker, which
 * is more accurate than geocoding whatever text someone typed.
 */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) {
    throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is not configured");
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox geocoding error (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const [lng, lat] = feature.center;
  return { lat, lng };
}

/**
 * Walking distance/time between two points via Mapbox's Directions
 * API (actual street routing, not a straight line - meaningfully
 * different in a dense grid like Crown Heights). Falls back to null
 * on any failure so the property page can just omit the walking-time
 * line rather than error.
 */
export async function getWalkingDirections({
  from,
  to,
}: {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
}): Promise<{ minutes: number; meters: number } | null> {
  if (!MAPBOX_TOKEN) return null;

  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?access_token=${MAPBOX_TOKEN}&overview=false`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      minutes: Math.round(route.duration / 60),
      meters: Math.round(route.distance),
    };
  } catch {
    return null;
  }
}
