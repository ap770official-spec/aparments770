import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mainPhotoUrl, type PropertySummary } from "@/lib/properties";

export default function PropertyCard({
  property,
  detailHref,
}: {
  property: PropertySummary;
  detailHref: string;
}) {
  const t = useTranslations("search");
  const photo = mainPhotoUrl(property.property_photos);

  return (
    <li className="overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={property.address}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="h-48 w-full bg-black/5 dark:bg-white/10" />
      )}

      <div className="flex flex-col gap-2 p-4">
        <p className="font-medium">{property.address}</p>
        <p className="text-sm text-black/70 dark:text-white/70">
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
