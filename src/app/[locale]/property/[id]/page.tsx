import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPropertyById } from "@/lib/properties";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getWalkingDirections } from "@/lib/mapbox";
import { formatHebrewDateShort } from "@/lib/hebrewDate";
import Map from "@/components/Map";
import FavoriteButton from "@/components/FavoriteButton";
import ShareMenu from "@/components/ShareMenu";
import PropertyGallery from "@/components/PropertyGallery";
import PropertyAmenities from "@/components/PropertyAmenities";
import BackToSearchLink from "@/components/BackToSearchLink";

export const dynamic = "force-dynamic";

const AMENITY_CATEGORIES = [
  "kitchen",
  "climate",
  "bathroom",
  "safety",
  "family",
  "outdoor",
  "shabbat_kosher",
  "proximity",
] as const;

function formatDisplayDate(isoDate: string, locale: string): string {
  if (locale === "he") return formatHebrewDateShort(isoDate);
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

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

  const landmark = property.regions;
  const landmarkName = landmark
    ? locale === "he"
      ? landmark.name_he
      : landmark.name_en
    : "";

  const title = property.address;

  const hasPropertyLocation = property.lat != null && property.lng != null;
  const hasLandmarkLocation =
    landmark?.landmark_lat != null && landmark?.landmark_lng != null;

  const walking =
    hasPropertyLocation && hasLandmarkLocation
      ? await getWalkingDirections({
          from: { lat: property.lat!, lng: property.lng! },
          to: { lat: landmark!.landmark_lat!, lng: landmark!.landmark_lng! },
        })
      : null;

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

  const amenityGroups = AMENITY_CATEGORIES.map((category) => ({
    category,
    items: property.property_amenities.filter((a) => a.category === category),
  })).filter((group) => group.items.length > 0);

  const hasDates = Boolean(query.checkin && query.checkout && query.guests);
  const datesCard = hasDates && (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#E5DED3]">
      <div className="grid grid-cols-2">
        <div className="flex flex-col gap-0.5 border-b border-e border-[#E5DED3] px-3.5 py-2.5">
          <span className="text-[10px] font-semibold text-[#8A8073]">
            {t("datesCheckin")}
          </span>
          <span className="text-[13px] text-ink">
            {formatDisplayDate(query.checkin!, locale)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 border-b border-[#E5DED3] px-3.5 py-2.5">
          <span className="text-[10px] font-semibold text-[#8A8073]">
            {t("datesCheckout")}
          </span>
          <span className="text-[13px] text-ink">
            {formatDisplayDate(query.checkout!, locale)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 px-3.5 py-2.5">
        <span className="text-[10px] font-semibold text-[#8A8073]">
          {t("datesGuestsLabel")}
        </span>
        <span className="text-[13px] text-ink">
          {t("datesGuestsValue", { count: Number(query.guests) })}
        </span>
      </div>
    </div>
  );

  const priceBlock = (
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-bold text-ink sm:text-2xl">
        ${property.price_per_night}
      </span>
      <span className="text-sm text-[#8A8073]">{t("perNightSuffix")}</span>
    </div>
  );

  return (
    <div className="pb-[76px] sm:pb-0">
      <div className="mx-auto max-w-6xl sm:px-10 sm:pt-5">
        <div className="hidden sm:block">
          <BackToSearchLink />
        </div>

        <div className="mt-0 sm:mt-4">
          <PropertyGallery
            photos={photos}
            propertyId={property.id}
            shareText={title}
          />
        </div>

        <div className="flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-0 sm:pt-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-serif-brand text-xl font-bold leading-tight text-ink sm:text-[32px]">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#5C5349] sm:text-sm">
              <span>
                {property.max_guests !== null
                  ? t("roomsGuestsLine", {
                      rooms: property.bedrooms,
                      guests: property.max_guests,
                    })
                  : t("roomsOnlyLine", { rooms: property.bedrooms })}
              </span>
            </div>
            {walking && landmark && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                >
                  <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.2" />
                </svg>
                {t("walkingTimePill", {
                  minutes: walking.minutes,
                  landmark: landmarkName,
                })}
              </span>
            )}
          </div>
          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
            <FavoriteButton propertyId={property.id} showLabel />
            <ShareMenu
              shareText={title}
              buttonClassName="flex h-11 w-11 items-center justify-center rounded-full border border-ink"
            />
          </div>
        </div>

        <div className="px-4 pt-4 sm:hidden">{priceBlock}</div>
        {hasDates && <div className="px-4 pt-4 sm:hidden">{datesCard}</div>}

        <div className="mt-5 flex flex-col gap-8 px-4 pb-8 sm:mt-9 sm:grid sm:grid-cols-[2fr_1fr] sm:gap-11 sm:px-0">
          <div className="flex flex-col gap-7">
            {description && (
              <div className="flex flex-col gap-2.5 border-b border-[#E5DED3] pb-6">
                <h2 className="text-lg font-bold text-ink sm:text-[19px]">
                  {t("aboutTitle")}
                </h2>
                <p className="text-sm leading-7 text-[#5C5349] sm:text-[15px]">
                  {description}
                </p>
              </div>
            )}

            {amenityGroups.length > 0 && (
              <div className="border-b border-[#E5DED3] pb-6">
                <PropertyAmenities groups={amenityGroups} />
              </div>
            )}

            {hasPropertyLocation && landmark && (
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-ink sm:text-[19px]">
                  {t("walkingDistanceTitle", { landmark: landmarkName })}
                </h2>
                {walking && (
                  <div className="flex items-center gap-3.5 rounded-xl border border-[#E5DED3] p-4">
                    <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-ink sm:h-11 sm:w-11">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </div>
                    <span className="text-[13.5px] font-semibold text-ink sm:text-[15px]">
                      {t("walkingTimeApprox", {
                        minutes: walking.minutes,
                        landmark: landmarkName,
                      })}
                    </span>
                  </div>
                )}
                <Map
                  className="h-40 w-full rounded-xl sm:h-52"
                  markers={[
                    { lat: property.lat!, lng: property.lng!, color: "#1A1512" },
                    ...(hasLandmarkLocation
                      ? [
                          {
                            lat: landmark.landmark_lat!,
                            lng: landmark.landmark_lng!,
                            color: "#6F4E37",
                            label: landmarkName,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            )}
          </div>

          <div className="hidden sm:block">
            <div className="sticky top-6 flex flex-col gap-4 rounded-2xl border border-[#E5DED3] p-6 shadow-[0_4px_24px_rgba(26,21,18,0.08)]">
              {priceBlock}
              {hasDates && datesCard}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-[10px] bg-accent-whatsapp px-4 py-3.5 text-base font-bold text-white"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="white"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.3 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" />
                </svg>
                {t("contactWhatsApp")}
              </a>
              <span className="text-center text-xs text-[#8A8073]">
                {t("bookingNote")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-[#E5DED3] bg-white px-4 py-3 sm:hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold text-ink">
            ${property.price_per_night}
          </span>
          <span className="text-[11px] text-[#8A8073]">
            {t("perNightSuffix")}
          </span>
        </div>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-accent-whatsapp px-3 py-3.5 text-sm font-bold text-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="white"
            aria-hidden="true"
          >
            <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.3 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" />
          </svg>
          {t("contactWhatsApp")}
        </a>
      </div>
    </div>
  );
}
