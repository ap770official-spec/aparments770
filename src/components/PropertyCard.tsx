import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mainMedia, type PropertySummary } from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import FavoriteButton from "@/components/FavoriteButton";

export default function PropertyCard({
  property,
  detailHref,
}: {
  property: PropertySummary;
  detailHref: string;
}) {
  const t = useTranslations("search");
  const media = mainMedia(property.property_photos);

  return (
    <li className="relative overflow-hidden rounded-lg border border-black/10">
      <FavoriteButton
        propertyId={property.id}
        className="absolute end-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 shadow"
      />

      {media ? (
        media.media_type === "video" ? (
          <video
            src={optimizedCloudinaryUrl(media.url)}
            className="h-48 w-full object-cover"
            muted
            controls
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizedCloudinaryUrl(media.url)}
            alt={property.address}
            className="h-48 w-full object-cover"
          />
        )
      ) : (
        <div className="h-48 w-full bg-black/5" />
      )}

      <div className="flex flex-col gap-2 p-4">
        <p className="font-medium">{property.address}</p>
        <p className="text-sm text-black/70">
          {property.bedrooms} · {property.beds}
        </p>
        <p className="font-semibold">
          ${property.price_per_night} {t("perNight")}
        </p>
        <Link
          href={detailHref}
          className="mt-2 inline-block rounded-md bg-foreground px-4 py-2 text-center text-background"
        >
          {t("viewDetails")}
        </Link>
      </div>
    </li>
  );
}
