import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPropertyById } from "@/lib/properties";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const AMENITY_CATEGORIES = [
  "general",
  "shabbat_kosher",
  "proximity",
] as const;

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{
    checkin?: string;
    checkout?: string;
    guests?: string;
  }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("property");
  const tCategory = await getTranslations("amenityCategories");
  const tAmenity = await getTranslations("amenities");
  const query = await searchParams;

  const property = await getPropertyById(id);

  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p>{t("notFound")}</p>
      </div>
    );
  }

  const photos = [...property.property_photos].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const description =
    locale === "he"
      ? (property.description_he ?? property.description_en)
      : (property.description_en ?? property.description_he);

  const message =
    query.checkin && query.checkout && query.guests
      ? t("whatsappMessage", {
          address: property.address,
          checkin: query.checkin,
          checkout: query.checkout,
          guests: query.guests,
        })
      : t("whatsappMessageGeneric", { address: property.address });

  const whatsappLink = buildWhatsAppLink({
    countryCode: property.phone_country_code,
    phoneNumber: property.phone_number,
    message,
  });

  const amenitiesByCategory = AMENITY_CATEGORIES.map((category) => ({
    category,
    items: property.property_amenities.filter(
      (a) => a.category === category,
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {photos.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {photos.map((photo) =>
            photo.media_type === "video" ? (
              <video
                key={photo.url}
                src={optimizedCloudinaryUrl(photo.url)}
                className="h-56 w-full rounded-lg object-cover"
                muted
                controls
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.url}
                src={optimizedCloudinaryUrl(photo.url)}
                alt={property.address}
                className="h-56 w-full rounded-lg object-cover"
              />
            ),
          )}
        </div>
      )}

      <h1 className="mt-6 text-2xl font-semibold">{property.address}</h1>
      <p className="mt-1 text-xl font-semibold">
        ${property.price_per_night}{" "}
        <span className="text-sm font-normal text-black/60 dark:text-white/60">
          {t("perNight")}
        </span>
      </p>

      {description && (
        <p className="mt-4 text-black/70 dark:text-white/70">
          {description}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-black/60 dark:text-white/60">
            {t("bedrooms")}
          </dt>
          <dd className="font-medium">{property.bedrooms}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">{t("beds")}</dt>
          <dd className="font-medium">{property.beds}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">
            {t("toilets")}
          </dt>
          <dd className="font-medium">{property.toilets}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">
            {t("bathtubs")}
          </dt>
          <dd className="font-medium">{property.bathtubs}</dd>
        </div>
        {property.checkin_time && (
          <div>
            <dt className="text-black/60 dark:text-white/60">
              {t("checkin")}
            </dt>
            <dd className="font-medium">{property.checkin_time}</dd>
          </div>
        )}
        {property.checkout_time && (
          <div>
            <dt className="text-black/60 dark:text-white/60">
              {t("checkout")}
            </dt>
            <dd className="font-medium">{property.checkout_time}</dd>
          </div>
        )}
        {property.max_guests !== null && (
          <div>
            <dt className="text-black/60 dark:text-white/60">
              {t("maxGuests")}
            </dt>
            <dd className="font-medium">{property.max_guests}</dd>
          </div>
        )}
        {property.min_nights !== null && (
          <div>
            <dt className="text-black/60 dark:text-white/60">
              {t("minNights")}
            </dt>
            <dd className="font-medium">{property.min_nights}</dd>
          </div>
        )}
      </dl>

      {amenitiesByCategory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">{t("amenitiesTitle")}</h2>
          {amenitiesByCategory.map((group) => (
            <div key={group.category} className="mt-3">
              <p className="text-sm font-medium text-black/60 dark:text-white/60">
                {tCategory(group.category)}
              </p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item.amenity_key}
                    className="rounded-full border border-black/10 px-3 py-1 text-sm dark:border-white/15"
                  >
                    {tAmenity(item.amenity_key)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block rounded-md bg-foreground px-6 py-3 text-background"
      >
        {t("contactWhatsApp")}
      </a>
    </div>
  );
}
