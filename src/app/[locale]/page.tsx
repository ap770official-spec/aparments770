import { getTranslations, setRequestLocale } from "next-intl/server";
import { getActiveRegions, getRegionBySlug, regionLabel } from "@/lib/regions";
import { getUpcomingHebrewHolidays } from "@/lib/hebrewHolidays";
import { searchProperties } from "@/lib/properties";
import SearchForm from "@/components/SearchForm";
import SearchResultsView from "@/components/SearchResultsView";
import FavoritesButton from "@/components/FavoritesButton";

// Regions come from Supabase and can change (admin adds one) without a
// redeploy, and the results list now depends on searchParams too -
// render this per-request instead of baking it in at build time.
export const dynamic = "force-dynamic";

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
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tSearch = await getTranslations("search");
  const regions = await getActiveRegions();
  const holidays = getUpcomingHebrewHolidays();
  const query = await searchParams;

  // No query params (first visit) falls back to the single active region
  // and 1 guest, so the page always shows a list instead of an empty state.
  const region = query.region
    ? await getRegionBySlug(query.region)
    : (regions[0] ?? null);
  const guests = Number(query.guests) || 1;

  const properties = region
    ? await searchProperties({ regionId: region.id, guests })
    : [];

  const detailQuery = new URLSearchParams();
  if (query.checkin) detailQuery.set("checkin", query.checkin);
  if (query.checkout) detailQuery.set("checkout", query.checkout);
  detailQuery.set("guests", String(guests));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-serif-brand text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-black/70">{t("about")}</p>
      <SearchForm regions={regions} holidays={holidays} />
      <FavoritesButton />

      <div className="mt-10">
        {region && (
          <p className="text-black/70">
            {tSearch("resultsFor", {
              region: regionLabel(region, locale),
              guests,
            })}
          </p>
        )}

        {properties.length === 0 ? (
          <p className="mt-6 text-black/70">{tSearch("noResults")}</p>
        ) : (
          <SearchResultsView
            properties={properties}
            searchQuery={detailQuery.toString()}
            labels={{
              listView: tSearch("listView"),
              mapView: tSearch("mapView"),
              perNight: tSearch("perNight"),
              viewDetails: tSearch("viewDetails"),
            }}
          />
        )}
      </div>
    </div>
  );
}
