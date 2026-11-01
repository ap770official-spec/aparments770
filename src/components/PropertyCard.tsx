import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PropertySummary } from "@/lib/properties";
import CardPhotoCarousel from "@/components/CardPhotoCarousel";
import { stayNights, isIsoDate } from "@/lib/availability";
import FavoriteButton from "@/components/FavoriteButton";

/** Nights in the search's stay, or 0 when the query has no valid dates. */
export function nightsFromQuery(searchQuery: string | undefined): number {
  const params = new URLSearchParams(searchQuery ?? "");
  const checkin = params.get("checkin");
  const checkout = params.get("checkout");
  if (!checkin || !checkout || !isIsoDate(checkin) || !isIsoDate(checkout)) {
    return 0;
  }
  return stayNights(checkin, checkout).length;
}

export default function PropertyCard({
  property,
  detailHref,
  searchQuery,
  landmarkLabel,
  className,
  onMouseEnter,
}: {
  property: PropertySummary;
  detailHref: string;
  searchQuery?: string;
  landmarkLabel?: string;
  className?: string;
  onMouseEnter?: () => void;
}) {
  const t = useTranslations("search");
  const tProperty = useTranslations("property");
  const nights = nightsFromQuery(searchQuery);

  return (
    <li
      onMouseEnter={onMouseEnter}
      className={`group relative flex flex-col overflow-hidden rounded-[14px] border border-line bg-white transition-shadow duration-200 ease-out focus-within:shadow-[0_0_0_2px_var(--ink)] [@media(hover:hover)]:hover:shadow-[0_6px_24px_rgba(26,21,18,0.10)] ${className ?? ""}`}
    >
      {/* Above the stretched title link (z-10) so it can be swiped; each
          photo is itself a link to the listing, so a tap still opens it. */}
      <div className="relative z-10 aspect-[3/2] w-full overflow-hidden">
        <CardPhotoCarousel
          photos={property.property_photos}
          href={detailHref}
          label={property.address}
        />
        {property.walking_minutes_to_landmark != null && (
          <span className="pointer-events-none absolute bottom-3 start-3 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
            {tProperty("walkingTimePill", {
              minutes: property.walking_minutes_to_landmark,
              landmark: landmarkLabel ?? "770",
            })}
          </span>
        )}
      </div>

      {/* Sits above the stretched link so the heart doesn't open the listing. */}
      <FavoriteButton
        propertyId={property.id}
        className="absolute end-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full"
        iconClassName="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow"
      />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-[17px] font-bold leading-snug text-ink">
          {/* The whole card is the link (stretched ::after), one tab stop. */}
          <Link
            href={detailHref}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {property.address}
          </Link>
        </h3>
        <p className="text-[15px] text-ink-soft">
          {property.max_guests !== null
            ? tProperty("roomsGuestsLine", {
                rooms: property.bedrooms,
                guests: property.max_guests,
              })
            : tProperty("roomsOnlyLine", { rooms: property.bedrooms })}
        </p>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-2">
          <span className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-ink">
              ${property.price_per_night.toLocaleString("en-US")}
            </span>
            <span className="text-sm text-ink-soft">
              {tProperty("perNightSuffix")}
            </span>
          </span>
          {nights > 0 && (
            <span className="text-sm font-semibold text-ink">
              {t("cardStayTotal", {
                total: `$${(nights * property.price_per_night).toLocaleString("en-US")}`,
                nights,
              })}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
