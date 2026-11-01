import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mainMedia, type PropertySummary } from "@/lib/properties";
import { AddressPinIcon, nightsFromQuery } from "@/components/PropertyCard";
import { CardMedia } from "@/components/CardMedia";
import { listingTitle, capacityLine, shortAddress } from "@/lib/listingText";

/**
 * Smaller card used in the map view's side list (vertical) and as the
 * single "selected pin" summary on mobile (horizontal) - distinct from
 * PropertyCard's full grid layout, per the owner's map-view mockup.
 * The whole card links to the listing.
 */
export default function CompactPropertyCard({
  property,
  detailHref,
  landmarkLabel,
  orientation,
  selected,
  onMouseEnter,
  onClick,
  searchQuery,
}: {
  property: PropertySummary;
  detailHref: string;
  landmarkLabel?: string;
  orientation: "vertical" | "horizontal";
  selected?: boolean;
  onMouseEnter?: () => void;
  onClick?: () => void;
  /** Search query, for the stay total when dates were picked. */
  searchQuery?: string;
}) {
  const tProperty = useTranslations("property");
  const t = useTranslations("search");
  const nights = nightsFromQuery(searchQuery);

  const title = listingTitle(tProperty, property);
  const addressLine = (
    <p className="flex min-w-0 items-center gap-1 text-[13px] text-ink-soft">
      <AddressPinIcon />
      <span dir="auto" className="truncate" title={property.address}>
        {shortAddress(property.address)}
      </span>
    </p>
  );

  const price = (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="flex items-baseline gap-1">
        <span className="text-[15px] font-bold text-ink">
          ${property.price_per_night.toLocaleString("en-US")}
        </span>
        <span className="text-[13px] text-ink-soft">
          {tProperty("perNightSuffix")}
        </span>
      </span>
      {nights > 0 && (
        <span className="text-[13px] font-semibold text-ink">
          {t("cardStayTotal", {
            total: `$${(nights * property.price_per_night).toLocaleString("en-US")}`,
            nights,
          })}
        </span>
      )}
    </p>
  );
  const walkingLine =
    property.walking_minutes_to_landmark != null ? (
      <p className="text-[13px] font-semibold text-ink">
        {tProperty("walkingTimePill", {
          minutes: property.walking_minutes_to_landmark,
          landmark: landmarkLabel ?? "770",
        })}
      </p>
    ) : null;

  if (orientation === "horizontal") {
    return (
      <Link
        href={detailHref}
        onClick={onClick}
        className="flex overflow-hidden rounded-xl border border-line bg-white"
      >
        <CardMedia media={mainMedia(property.property_photos)} className="min-h-24 w-24 shrink-0 self-stretch" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5">
          <h3 className="truncate text-[15px] font-bold text-ink">{title}</h3>
          {addressLine}
          {walkingLine}
          {price}
        </div>
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center px-3 text-ink-soft"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="rtl:-scale-x-100">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={detailHref}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`flex flex-col overflow-hidden rounded-[10px] border bg-white transition-shadow ${
        selected ? "border-brand shadow-[0_0_0_2px_var(--brand)]" : "border-line"
      }`}
    >
      <div className="relative h-[120px] w-full overflow-hidden">
        <CardMedia media={mainMedia(property.property_photos)} className="h-full w-full" />
        {property.walking_minutes_to_landmark != null && (
          <span className="absolute bottom-2 end-2 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
            {tProperty("walkingTimePill", {
              minutes: property.walking_minutes_to_landmark,
              landmark: landmarkLabel ?? "770",
            })}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-3.5 py-3">
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        {addressLine}
        <p className="text-[13px] text-ink-soft">
          {capacityLine(tProperty, property)}
        </p>
        {price}
      </div>
    </Link>
  );
}
