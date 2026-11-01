import { useTranslations } from "next-intl";
import { listingTitle, capacityLine, shortAddress } from "@/lib/listingText";
import { Link } from "@/i18n/navigation";
import { mainMedia, type PropertySummary } from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
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

export function CardMedia({
  property,
  className,
}: {
  property: PropertySummary;
  className: string;
}) {
  const media = mainMedia(property.property_photos);
  if (!media) return <div className={`${className} bg-placeholder`} />;
  if (media.media_type === "video") {
    // A still first frame with a play badge: the card is a link, so a video
    // with its own controls would swallow the tap meant to open the listing.
    return (
      <div className={`relative ${className}`}>
        <video
          src={`${optimizedCloudinaryUrl(media.url)}#t=0.1`}
          className="pointer-events-none h-full w-full object-cover"
          preload="metadata"
          muted
          playsInline
          tabIndex={-1}
          aria-hidden="true"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" />
            </svg>
          </span>
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizedCloudinaryUrl(media.url)}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${className} object-cover`}
    />
  );
}

/** Small map pin in front of a listing's address line. */
export function AddressPinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
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
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <CardMedia property={property} className="h-full w-full" />
        {property.walking_minutes_to_landmark != null && (
          <span className="absolute bottom-3 start-3 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
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
        className="absolute end-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full"
        iconClassName="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow"
      />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-[17px] font-bold leading-snug text-ink">
          {/* The whole card is the link (stretched ::after), one tab stop. */}
          <Link
            href={detailHref}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {listingTitle(tProperty, property)}
          </Link>
        </h3>
        <p className="flex min-w-0 items-center gap-1 text-sm text-ink-soft">
          <AddressPinIcon />
          <span dir="auto" className="truncate" title={property.address}>
            {shortAddress(property.address)}
          </span>
        </p>
        <p className="text-sm text-ink-soft">
          {capacityLine(tProperty, property)}
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
