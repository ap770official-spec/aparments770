import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mainMedia, type PropertySummary } from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import FavoriteButton from "@/components/FavoriteButton";

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
  const media = mainMedia(property.property_photos);

  const params = new URLSearchParams(searchQuery ?? "");
  const checkin = params.get("checkin");
  const checkout = params.get("checkout");
  const guests = params.get("guests");
  const message =
    checkin && checkout && guests
      ? tProperty("whatsappMessage", {
          address: property.address,
          checkin,
          checkout,
          guests,
        })
      : tProperty("whatsappMessageGeneric", { address: property.address });
  const whatsappLink = buildWhatsAppLink({
    countryCode: property.phone_country_code,
    phoneNumber: property.phone_number,
    message,
  });

  return (
    <li
      onMouseEnter={onMouseEnter}
      className={`relative flex flex-col overflow-hidden rounded-[14px] border border-[#E5DED3] bg-white ${className ?? ""}`}
    >
      <div className="relative h-[180px] w-full">
        <FavoriteButton
          propertyId={property.id}
          className="absolute end-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow"
        />
        {property.walking_minutes_to_landmark != null && (
          <span className="absolute bottom-3 start-3 z-10 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
            {tProperty("walkingTimePill", {
              minutes: property.walking_minutes_to_landmark,
              landmark: landmarkLabel ?? "770",
            })}
          </span>
        )}
        {media ? (
          media.media_type === "video" ? (
            <video
              src={optimizedCloudinaryUrl(media.url)}
              className="h-full w-full object-cover"
              muted
              controls
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
          <div className="h-full w-full bg-placeholder" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="text-[17px] font-bold text-ink">{property.address}</h3>
        <p className="text-sm text-[#5C5349]">
          {property.max_guests !== null
            ? tProperty("roomsGuestsLine", {
                rooms: property.bedrooms,
                guests: property.max_guests,
              })
            : tProperty("roomsOnlyLine", { rooms: property.bedrooms })}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-ink">
            ${property.price_per_night}
          </span>
          <span className="text-[13px] text-[#8A8073]">
            {tProperty("perNightSuffix")}
          </span>
        </div>
        <div className="mt-auto flex gap-2 pt-2">
          <Link
            href={detailHref}
            className="flex-1 rounded-lg border border-ink px-3 py-2.5 text-center text-sm font-semibold text-ink"
          >
            {t("viewDetails")}
          </Link>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-whatsapp px-3 py-2.5 text-sm font-semibold text-white"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="white"
              aria-hidden="true"
            >
              <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.3 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" />
            </svg>
            {t("whatsappCta")}
          </a>
        </div>
      </div>
    </li>
  );
}
