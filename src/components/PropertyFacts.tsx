import { useTranslations } from "next-intl";
import type { PropertyDetail } from "@/lib/properties";

// 24x24, 1.8 stroke, rounded caps/joins - the same visual language as the
// amenity icons in lib/amenityIcons.
const ICONS = {
  type: (
    <>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9v12h14V9" />
      <path d="M10 21v-6h4v6" />
    </>
  ),
  bedrooms: (
    <>
      <path d="M4 20V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v15" />
      <path d="M2 20h20" />
      <circle cx="15" cy="12" r="1" />
    </>
  ),
  beds: (
    <>
      <path d="M2 18V7" />
      <path d="M2 14h20v4" />
      <path d="M22 14v-2a3 3 0 0 0-3-3h-8v5" />
      <circle cx="6.5" cy="11" r="1.5" />
    </>
  ),
  guests: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </>
  ),
  toilets: (
    <>
      <path d="M6 3h7v8H6z" />
      <path d="M4 11h16a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" />
      <path d="M9 17l-1 4h8l-1-4" />
    </>
  ),
  bathtubs: (
    <>
      <path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z" />
      <path d="M6 12V5a2 2 0 0 1 4 0" />
      <path d="M7 19l-1 2M17 19l1 2" />
    </>
  ),
  minNights: (
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  ),
  checkin: (
    <>
      <path d="M14 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5" />
      <path d="M3 12h11M10 8l4 4-4 4" />
    </>
  ),
  checkout: (
    <>
      <path d="M10 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5" />
      <path d="M10 12h11M17 8l4 4-4 4" />
    </>
  ),
} satisfies Record<string, React.ReactNode>;

type FactKey = keyof typeof ICONS;

/** Postgres `time` comes back as "HH:MM:SS"; guests only need "HH:MM". */
function formatTime(time: string): string {
  return time.slice(0, 5);
}

export default function PropertyFacts({
  property,
}: {
  property: PropertyDetail;
}) {
  const t = useTranslations("property");

  const facts: { key: FactKey; label: string }[] = [
    { key: "type", label: t(`factType_${property.property_type}`) },
    { key: "bedrooms", label: t("factBedrooms", { count: property.bedrooms }) },
  ];
  if (property.beds > 0) {
    facts.push({ key: "beds", label: t("factBeds", { count: property.beds }) });
  }
  if (property.max_guests !== null) {
    facts.push({
      key: "guests",
      label: t("factGuests", { count: property.max_guests }),
    });
  }
  if (property.toilets > 0) {
    facts.push({
      key: "toilets",
      label: t("factToilets", { count: property.toilets }),
    });
  }
  if (property.bathtubs > 0) {
    facts.push({
      key: "bathtubs",
      label: t("factBathtubs", { count: property.bathtubs }),
    });
  }
  if (property.min_nights !== null && property.min_nights > 1) {
    facts.push({
      key: "minNights",
      label: t("factMinNights", { count: property.min_nights }),
    });
  }
  if (property.checkin_time) {
    facts.push({
      key: "checkin",
      label: t("factCheckin", { time: formatTime(property.checkin_time) }),
    });
  }
  if (property.checkout_time) {
    facts.push({
      key: "checkout",
      label: t("factCheckout", { time: formatTime(property.checkout_time) }),
    });
  }

  return (
    <section
      aria-labelledby="property-facts-title"
      className="flex flex-col gap-3.5 border-b border-line pb-6"
    >
      <h2
        id="property-facts-title"
        className="text-lg font-bold text-ink sm:text-[19px]"
      >
        {t("factsTitle")}
      </h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-3">
        {facts.map((fact) => (
          <li key={fact.key} className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={
                  fact.key === "checkin" || fact.key === "checkout"
                    ? "rtl:-scale-x-100"
                    : undefined
                }
              >
                {ICONS[fact.key]}
              </svg>
            </span>
            <span className="text-sm leading-snug text-ink">{fact.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
