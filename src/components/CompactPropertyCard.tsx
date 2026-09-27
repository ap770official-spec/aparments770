import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mainMedia, type PropertySummary } from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";

/**
 * Smaller card used in the map view's side list (vertical) and as the
 * single "selected pin" summary on mobile (horizontal) - distinct from
 * PropertyCard's full grid layout, per the owner's map-view mockup.
 */
export default function CompactPropertyCard({
  property,
  detailHref,
  orientation,
  selected,
  onMouseEnter,
  onClick,
}: {
  property: PropertySummary;
  detailHref: string;
  orientation: "vertical" | "horizontal";
  selected?: boolean;
  onMouseEnter?: () => void;
  onClick?: () => void;
}) {
  const t = useTranslations("search");
  const media = mainMedia(property.property_photos);

  const image = media ? (
    media.media_type === "video" ? (
      <video
        src={optimizedCloudinaryUrl(media.url)}
        className="h-full w-full object-cover"
        muted
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={optimizedCloudinaryUrl(media.url)}
        alt={property.address}
        className="h-full w-full object-cover"
      />
    )
  ) : (
    <div className="h-full w-full bg-[#D8CFC1]" />
  );

  if (orientation === "horizontal") {
    // The WhatsApp number lives on PropertyDetail, not this summary -
    // both the card and the icon go to the detail page, where the real
    // WhatsApp button (with the actual number) is.
    return (
      <Link
        href={detailHref}
        className="flex overflow-hidden rounded-xl border border-[#E5DED3] bg-white"
      >
        <div className="h-24 w-24 shrink-0">{image}</div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5">
          <h3 className="truncate text-[13.5px] font-bold text-[#1A1512]">
            {property.address}
          </h3>
          <p className="text-xs text-[#5C5349]">
            {property.bedrooms} · {property.beds}
          </p>
          <p className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-[#1A1512]">
              ${property.price_per_night}
            </span>
            <span className="text-[11px] text-[#8A8073]">{t("perNight")}</span>
          </p>
        </div>
        <span
          aria-hidden="true"
          className="my-auto ms-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25623F]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.3 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" />
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
        selected ? "border-brand shadow-[0_0_0_2px_var(--brand)]" : "border-[#E5DED3]"
      }`}
    >
      <div className="h-[120px] w-full">{image}</div>
      <div className="flex flex-col gap-1 px-3.5 py-3">
        <h3 className="text-sm font-bold text-[#1A1512]">{property.address}</h3>
        <p className="text-xs text-[#5C5349]">
          {property.bedrooms} · {property.beds}
        </p>
        <p className="flex items-baseline gap-1">
          <span className="text-[15px] font-bold text-[#1A1512]">
            ${property.price_per_night}
          </span>
          <span className="text-xs text-[#8A8073]">{t("perNight")}</span>
        </p>
      </div>
    </Link>
  );
}
