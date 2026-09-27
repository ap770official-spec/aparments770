// Icon shapes for each amenity key, matching the design mockup's inline SVG
// paths verbatim for the 27 keys the mockup defines (kitchen/climate/
// bathroom/safety/family/outdoor). The mockup has no icons for the
// community-specific shabbat_kosher/proximity keys (kept from the older
// taxonomy - see PropertyForm), so those are original icons drawn to match
// the same visual language (24x24, 1.8 stroke, rounded caps/joins).
const ICON_SHAPES: Record<string, React.ReactNode> = {
  // Kitchen
  kitchen_hotplate: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  kitchen_urn: (
    <>
      <rect x="6" y="6" width="12" height="14" rx="3" />
      <path d="M6 11H4M18 11h2" />
      <circle cx="12" cy="4" r="1.5" />
    </>
  ),
  kitchen_fridge: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M5 10h14M9 5v3M9 14v3" />
    </>
  ),
  kitchen_stove: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8" cy="9" r="2" />
      <circle cx="16" cy="9" r="2" />
      <circle cx="8" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
    </>
  ),
  kitchen_oven: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="6" y="6" width="12" height="8" rx="1" />
      <circle cx="7" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  kitchen_microwave: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <rect x="6" y="9" width="8" height="7" rx="1" />
      <circle cx="18" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  kitchen_kettle: (
    <>
      <path d="M6 9h10a2 2 0 0 1 2 2c0 3-2 5-6 5s-6-2-6-5V9z" />
      <path d="M18 10h1a2 2 0 0 1 0 4h-1M9 4c0 1-1 1-1 2M13 4c0 1-1 1-1 2" />
    </>
  ),
  kitchen_coffee: (
    <>
      <rect x="4" y="3" width="16" height="8" rx="1" />
      <path d="M8 11v3a4 4 0 0 0 8 0v-3" />
      <rect x="9" y="17" width="6" height="3" rx="1" />
    </>
  ),
  kitchen_utensils: (
    <>
      <path d="M5 2v7a2 2 0 0 0 4 0V2M7 9v13" />
      <path d="M15 2c-1.2 0-2 2-2 5s.8 5 2 5v9" />
    </>
  ),

  // Climate & connectivity
  wifi: (
    <>
      <path d="M2 8.5a16 16 0 0 1 20 0" />
      <path d="M5 12a11 11 0 0 1 14 0" />
      <path d="M8.5 15.5a6 6 0 0 1 7 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  ac: <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />,
  heating: (
    <path d="M12 3c1 3-2 4-2 7a4 4 0 1 0 8 0c0-1-.5-2-1-3 .2 1.5-.8 2.5-2 2.5S13 8.5 13 7c0-1.5 1-2.5-1-4z" />
  ),

  // Bathroom & laundry
  linens: (
    <>
      <rect x="5" y="5" width="14" height="4" rx="1" />
      <rect x="5" y="11" width="14" height="4" rx="1" />
      <rect x="5" y="17" width="14" height="4" rx="1" />
    </>
  ),
  toiletries: <path d="M10 2h4v3l2 2v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7l2-2V2z" />,
  hairdryer: (
    <>
      <path d="M3 9a6 6 0 0 1 6-6h3a6 6 0 0 1 0 12h-1l4 6" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  washer: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="12" cy="13" r="1.8" />
    </>
  ),
  dryer: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <path d="M9.5 13a2.5 2.5 0 0 1 2.5-2.5" />
    </>
  ),
  iron: (
    <>
      <path d="M3 16c0-4 3-8 9-8h6a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H7l-4 3v-3z" />
      <circle cx="17" cy="10" r="1" fill="currentColor" stroke="none" />
    </>
  ),

  // Safety
  safe: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M7 4v3M17 4v3M7 17v3M17 17v3" />
    </>
  ),
  smoke_detector: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </>
  ),
  fire_extinguisher: (
    <>
      <rect x="9" y="6" width="6" height="14" rx="2" />
      <path d="M12 6V4M9 4h6M7 10h2M15 9l3-2" />
    </>
  ),
  first_aid: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M12 10v6M9 13h6" />
      <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
    </>
  ),

  // Family
  crib: (
    <>
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M4 14h16M8 20v-6M16 20v-6" />
    </>
  ),
  games: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),

  // Outdoor & parking
  balcony: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <path d="M3 20h18M7 16v4M12 16v4M17 16v4" />
    </>
  ),
  sukkah: (
    <>
      <path d="M12 3L3 10h18L12 3z" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  parking: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 16V8h4a3 3 0 0 1 0 6H9" />
    </>
  ),

  // Shabbat & kosher (no mockup reference - drawn to match its style)
  shabbat_elevator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 10l3-3 3 3" />
      <path d="M9 14l3 3 3-3" />
    </>
  ),
  non_electric_lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  hotplate: (
    <>
      <path d="M4 10a8 4 0 0 1 16 0" />
      <rect x="3" y="10" width="18" height="3" rx="1" />
    </>
  ),
  shabbat_clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l4 2" />
    </>
  ),
  kosher_kitchen: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </>
  ),

  // Proximity (no mockup reference - drawn to match its style)
  supermarket: (
    <>
      <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6" />
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  mikvah: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  bakery: (
    <>
      <path d="M4 13a8 5 0 0 1 16 0c0 3-4 5-8 5s-8-2-8-5z" />
      <path d="M9 9l1 3M12 8l1 4M15 9l1 3" />
    </>
  ),
  subway: (
    <>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M5 10h14" />
      <circle cx="9" cy="14" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
};

const FALLBACK_SHAPE = <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />;

export function AmenityIcon({
  amenityKey,
  size = 20,
  className,
}: {
  amenityKey: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_SHAPES[amenityKey] ?? FALLBACK_SHAPE}
    </svg>
  );
}
