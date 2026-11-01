/**
 * Homepage result filters (price, rooms, amenities, sort). The URL is the
 * source of truth: the server reads these params to run the search, and the
 * filter UI writes them. Shared by both sides, so no server-only imports.
 */

export const PRICE_OPTIONS = [100, 150, 200, 250] as const;
export const ROOM_OPTIONS = [1, 2, 3, 4] as const;

/**
 * Amenities a guest is likely to filter by. Each option can match several
 * stored keys: the taxonomy has both a kitchen "hotplate" and a Shabbat
 * "hotplate" from the older list, and to a guest both are "a plata".
 * The label comes from the first key's translation unless labelKey is set.
 */
export const AMENITY_FILTERS: {
  id: string;
  keys: string[];
  labelKey?: string;
}[] = [
  { id: "hotplate", keys: ["kitchen_hotplate", "hotplate"], labelKey: "kitchen_hotplate" },
  { id: "shabbat_elevator", keys: ["shabbat_elevator"] },
  { id: "kosher_kitchen", keys: ["kosher_kitchen"] },
  { id: "ac", keys: ["ac"] },
  { id: "wifi", keys: ["wifi"] },
  { id: "washer", keys: ["washer"] },
  { id: "crib", keys: ["crib"] },
  { id: "parking", keys: ["parking"] },
  { id: "balcony", keys: ["balcony"] },
  { id: "sukkah", keys: ["sukkah"] },
];

export const SORT_OPTIONS = ["distance", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export type ResultFilters = {
  maxPrice: number | null;
  minRooms: number | null;
  /** AMENITY_FILTERS ids; a listing must match every one. */
  amenities: string[];
  sort: SortOption;
};

export const EMPTY_FILTERS: ResultFilters = {
  maxPrice: null,
  minRooms: null,
  amenities: [],
  sort: "distance",
};

function positiveInt(value: string | null | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Reads filters from URL params, ignoring anything malformed. */
export function parseResultFilters(params: {
  maxPrice?: string | null;
  minRooms?: string | null;
  amenities?: string | null;
  sort?: string | null;
}): ResultFilters {
  const known = new Set(AMENITY_FILTERS.map((a) => a.id));
  return {
    maxPrice: positiveInt(params.maxPrice),
    minRooms: positiveInt(params.minRooms),
    amenities: (params.amenities ?? "")
      .split(",")
      .filter((id) => known.has(id)),
    sort: (SORT_OPTIONS as readonly string[]).includes(params.sort ?? "")
      ? (params.sort as SortOption)
      : "distance",
  };
}

/** Writes filters into URL params (removing the ones at their default). */
export function applyResultFilters(
  params: URLSearchParams,
  filters: ResultFilters,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = (key: string, value: string | null) =>
    value ? next.set(key, value) : next.delete(key);
  set("maxPrice", filters.maxPrice ? String(filters.maxPrice) : null);
  set("minRooms", filters.minRooms ? String(filters.minRooms) : null);
  set("amenities", filters.amenities.length ? filters.amenities.join(",") : null);
  set("sort", filters.sort !== "distance" ? filters.sort : null);
  return next;
}

/** How many filters (not counting sort) are switched on. */
export function activeFilterCount(filters: ResultFilters): number {
  return (
    (filters.maxPrice ? 1 : 0) +
    (filters.minRooms ? 1 : 0) +
    filters.amenities.length
  );
}

/** Stored amenity keys a listing must include, one group per chosen filter. */
export function amenityKeyGroups(ids: string[]): string[][] {
  return AMENITY_FILTERS.filter((a) => ids.includes(a.id)).map((a) => a.keys);
}
