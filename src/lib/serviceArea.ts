/**
 * Listings are limited to Brooklyn, NY. This guards against honest
 * mistakes (picking a same-named street in another city or country),
 * not deliberate bypassing - the admin approval step covers that.
 */

/** Rough Brooklyn bounding box [minLng, minLat, maxLng, maxLat] for search. */
export const BROOKLYN_BBOX: [number, number, number, number] = [
  -74.05, 40.56, -73.83, 40.74,
];

/**
 * Whether a Mapbox place name is in Brooklyn: either the borough itself
 * ("..., Brooklyn, New York 11213, United States") or a Brooklyn ZIP
 * (112xx). Requiring "New York" rules out Brooklyns in other states.
 */
export function isBrooklynAddress(address: string): boolean {
  return (
    /\bBrooklyn, New York\b/.test(address) ||
    /\bNew York 112\d\d\b/.test(address)
  );
}
