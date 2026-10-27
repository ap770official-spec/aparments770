/**
 * Every amenity a listing can have, grouped by category in display
 * order. Shared by the owner's publish wizard and the admin edit form
 * so both always offer the same set; labels live in messages/*.json
 * under "amenities" / "amenityCategories".
 */
export type AmenityCategory =
  | "kitchen"
  | "climate"
  | "bathroom"
  | "safety"
  | "family"
  | "outdoor"
  | "shabbat_kosher"
  | "proximity";

export const AMENITY_GROUPS: { category: AmenityCategory; keys: string[] }[] = [
  {
    category: "kitchen",
    keys: [
      "kitchen_hotplate",
      "kitchen_urn",
      "kitchen_fridge",
      "kitchen_stove",
      "kitchen_oven",
      "kitchen_microwave",
      "kitchen_kettle",
      "kitchen_coffee",
      "kitchen_utensils",
    ],
  },
  { category: "climate", keys: ["wifi", "ac", "heating"] },
  {
    category: "bathroom",
    keys: ["linens", "toiletries", "hairdryer", "washer", "dryer", "iron"],
  },
  {
    category: "safety",
    keys: ["safe", "smoke_detector", "fire_extinguisher", "first_aid"],
  },
  { category: "family", keys: ["crib", "games"] },
  { category: "outdoor", keys: ["balcony", "sukkah", "parking"] },
  {
    category: "shabbat_kosher",
    keys: [
      "shabbat_elevator",
      "non_electric_lock",
      "hotplate",
      "shabbat_clock",
      "kosher_kitchen",
    ],
  },
  {
    category: "proximity",
    keys: ["supermarket", "mikvah", "bakery", "subway"],
  },
];
