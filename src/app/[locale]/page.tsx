import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDefaultRegion, getRegionBySlug } from "@/lib/regions";
import { getUpcomingHebrewHolidays } from "@/lib/hebrewHolidays";
import { searchProperties } from "@/lib/properties";
import { isIsoDate } from "@/lib/availability";
import { formatHebrewDateShort } from "@/lib/hebrewDate";
import SearchForm from "@/components/SearchForm";
import HeroScene from "@/components/home/HeroScene";
import SearchFilters from "@/components/SearchFilters";
import SearchResultsView from "@/components/SearchResultsView";
import FavoritesButton from "@/components/FavoritesButton";
import SortSelect from "@/components/SortSelect";
import { Link } from "@/i18n/navigation";
import {
  HomeTrustStrip,
  HomeHowItWorks,
  HomeFaq,
  HomeOwnerCta,
  PinIcon,
} from "@/components/home/HomeSections";
import {
  parseResultFilters,
  applyResultFilters,
  activeFilterCount,
  amenityKeyGroups,
  EMPTY_FILTERS,
} from "@/lib/searchFilters";

// Regions come from Supabase and can change (admin adds one) without a
// redeploy, and the results list now depends on searchParams too -
// render this per-request instead of baking it in at build time.
export const dynamic = "force-dynamic";

function formatStayDate(isoDate: string, locale: string): string {
  if (locale === "he") return formatHebrewDateShort(isoDate);
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    region?: string;
    checkin?: string;
    checkout?: string;
    guests?: string;
    maxWalking?: string;
    maxPrice?: string;
    minRooms?: string;
    amenities?: string;
    sort?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tSearch = await getTranslations("search");
  const defaultRegion = await getDefaultRegion();
  const holidays = getUpcomingHebrewHolidays();
  const query = await searchParams;

  // No query params (first visit) falls back to the site's default region
  // and 1 guest, so the page always shows a list instead of an empty state.
  const region = query.region
    ? await getRegionBySlug(query.region)
    : defaultRegion;
  const guests = Number(query.guests) || 1;
  const maxWalking = query.maxWalking ? Number(query.maxWalking) : null;
  const filters = parseResultFilters(query);

  const properties = region
    ? await searchProperties({
        regionId: region.id,
        guests,
        maxWalkingMinutes: maxWalking ?? undefined,
        // The homepage form searches here (not /search), so the chosen
        // dates must filter out listings that aren't free for the stay.
        checkin: query.checkin,
        checkout: query.checkout,
        maxPrice: filters.maxPrice,
        minBedrooms: filters.minRooms,
        amenityGroups: amenityKeyGroups(filters.amenities),
        sort: filters.sort,
      })
    : [];

  // The page's own query, for controls that change one param and keep the
  // rest (sort, "clear filters").
  const currentQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value) currentQuery.set(key, value);
  }
  const hasFilters = activeFilterCount(filters) > 0;
  const clearFiltersHref = `/?${applyResultFilters(currentQuery, {
    ...EMPTY_FILTERS,
    sort: filters.sort,
  }).toString()}`;

  // "Available" is only a claim we can make once dates were searched.
  const hasDates = Boolean(
    query.checkin &&
      query.checkout &&
      isIsoDate(query.checkin) &&
      isIsoDate(query.checkout),
  );

  const detailQuery = new URLSearchParams();
  if (query.checkin) detailQuery.set("checkin", query.checkin);
  if (query.checkout) detailQuery.set("checkout", query.checkout);
  detailQuery.set("guests", String(guests));

  return (
    <div className="flex flex-col">
      <section className="relative isolate overflow-hidden bg-cream">
        {/* Soft warm light from the top corner - decoration only. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -end-40 -z-10 h-[520px] w-[520px] rounded-full bg-gold-soft/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -start-32 -z-10 h-[420px] w-[420px] rounded-full bg-white/70 blur-3xl"
        />
        <HeroScene />
        {/* Ground line: the building stands on it, and it closes the hero.
            Fades out at both ends instead of stopping hard. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[linear-gradient(to_right,transparent,var(--brand)_4%,var(--brand)_96%,transparent)] opacity-80"
        />
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-10 sm:pt-16 sm:pb-12">
          <div className="flex flex-col items-start gap-3 sm:gap-4">
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[13px] font-semibold text-brand ring-1 ring-line">
              <PinIcon />
              {t("eyebrow")}
            </span>
            <h1 className="font-serif-brand text-[32px] leading-[1.1] font-bold text-balance text-ink sm:text-[56px] xl:max-w-[620px]">
              {t("title")}
            </h1>
            <p className="max-w-[560px] text-[15px] leading-relaxed text-ink-soft sm:text-[18px]">
              {t("about")}
            </p>
          </div>

          <div className="relative xl:max-w-[780px]">
            {/* From xl the building passes behind the search: a soft cream
                glow around the form clears the lines next to it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 top-2 -bottom-6 hidden rounded-full bg-cream/85 blur-xl xl:block"
            />
            <div className="relative">
              <SearchForm
                defaultRegionSlug={defaultRegion?.slug ?? ""}
                holidays={holidays}
                initialCheckin={query.checkin}
                initialCheckout={query.checkout}
                initialGuests={guests}
                currentQuery={currentQuery.toString()}
              />
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <SearchFilters
              region={region?.slug ?? defaultRegion?.slug ?? ""}
              checkin={query.checkin}
              checkout={query.checkout}
              guests={guests}
              activeMaxWalking={maxWalking}
              filters={filters}
            />
          </div>

          <HomeTrustStrip />
        </div>
      </section>

      <section id="results" className="results-region flex-1 scroll-mt-4">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-10 sm:py-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
            <h2 className="font-serif-brand text-xl font-bold text-ink sm:text-[28px]">
              {/* Never a number: with only a handful of listings, a count
                  reads as "empty site" rather than "curated". */}
              {properties.length === 0
                ? t("resultsHeadingEmpty")
                : hasDates
                  ? t("resultsCountForDates", {
                      dates: `${formatStayDate(query.checkin!, locale)} – ${formatStayDate(query.checkout!, locale)}`,
                    })
                  : t("resultsCount")}
            </h2>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <FavoritesButton />
              <SortSelect
                value={filters.sort}
                currentQuery={currentQuery.toString()}
              />
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-[15px] text-ink-soft">
                {hasFilters
                  ? t("noResultsForFilters")
                  : query.checkin && query.checkout
                    ? tSearch("noResultsForDates")
                    : tSearch("noResults")}
              </p>
              {hasFilters && (
                <Link
                  href={clearFiltersHref}
                  scroll={false}
                  className="flex min-h-11 items-center rounded-[10px] border border-ink px-4 text-[15px] font-semibold text-ink"
                >
                  {t("filtersClearAll")}
                </Link>
              )}
            </div>
          ) : (
            <SearchResultsView
              properties={properties}
              searchQuery={detailQuery.toString()}
              landmark={
                region?.landmark_lat != null && region?.landmark_lng != null
                  ? { lat: region.landmark_lat, lng: region.landmark_lng }
                  : null
              }
              landmarkLabel="770"
              labels={{
                listView: tSearch("listView"),
                mapView: tSearch("mapView"),
                perNight: tSearch("perNight"),
                viewDetails: tSearch("viewDetails"),
              }}
            />
          )}
        </div>
      </section>

      <HomeHowItWorks />
      <HomeFaq />
      <HomeOwnerCta />
    </div>
  );
}
