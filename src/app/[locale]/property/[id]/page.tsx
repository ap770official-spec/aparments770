import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPropertyById } from "@/lib/properties";
import { getWalkingDirections } from "@/lib/mapbox";
import { getUpcomingHebrewHolidays } from "@/lib/hebrewHolidays";
import Map from "@/components/Map";
import FavoriteButton from "@/components/FavoriteButton";
import ShareMenu from "@/components/ShareMenu";
import PropertyGallery from "@/components/PropertyGallery";
import PropertyAmenities from "@/components/PropertyAmenities";
import BackToSearchLink from "@/components/BackToSearchLink";
import PropertyFacts from "@/components/PropertyFacts";
import {
  BookingProvider,
  BookingCard,
  MobileBookingSection,
  MobileBookingBar,
} from "@/components/PropertyBooking";

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

  const amenityGroups = AMENITY_CATEGORIES.map((category) => ({
    category,
    items: property.property_amenities.filter((a) => a.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <BookingProvider
      address={property.address}
      pricePerNight={property.price_per_night}
      maxGuests={property.max_guests}
      minNights={property.min_nights}
      phoneCountryCode={property.phone_country_code}
      phoneNumber={property.phone_number}
      holidays={getUpcomingHebrewHolidays()}
      initialCheckin={query.checkin}
      initialCheckout={query.checkout}
      initialGuests={query.guests}
    >
      <div className="pb-[calc(84px+env(safe-area-inset-bottom))] sm:pb-0">
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

          <div className="px-4 pt-5 sm:hidden">
            <MobileBookingSection />
          </div>

          <div className="mt-5 flex flex-col gap-8 px-4 pb-8 sm:mt-9 sm:grid sm:grid-cols-[2fr_1fr] sm:gap-11 sm:px-0">
            <div className="flex flex-col gap-7">
              <PropertyFacts property={property} />

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
              <BookingCard />
            </div>
          </div>
        </div>

        <MobileBookingBar />
      </div>
    </BookingProvider>
  );
}
