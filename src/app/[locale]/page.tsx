import { getTranslations, setRequestLocale } from "next-intl/server";
import { getActiveRegions, getRegionBySlug } from "@/lib/regions";
import { getUpcomingHebrewHolidays } from "@/lib/hebrewHolidays";
import { searchProperties } from "@/lib/properties";
import SearchForm from "@/components/SearchForm";
import SearchFilters from "@/components/SearchFilters";
import SearchResultsView from "@/components/SearchResultsView";
import FavoritesButton from "@/components/FavoritesButton";
import HowItWorksSection from "@/components/HowItWorksSection";
import FaqAccordion from "@/components/FaqAccordion";
import { CONTACT_PHONE_DISPLAY, CONTACT_EMAIL } from "@/lib/contactInfo";

type FaqItem = { q: string; a: string };
type FaqGroup = { title: string; items: FaqItem[] };

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
    maxWalking?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tSearch = await getTranslations("search");
  const nav = await getTranslations("nav");
  const tFaq = await getTranslations("faq");
  const regions = await getActiveRegions();
  const holidays = getUpcomingHebrewHolidays();
  const query = await searchParams;

  // No query params (first visit) falls back to the single active region
  // and 1 guest, so the page always shows a list instead of an empty state.
  const region = query.region
    ? await getRegionBySlug(query.region)
    : (regions[0] ?? null);
  const guests = Number(query.guests) || 1;
  const maxWalking = query.maxWalking ? Number(query.maxWalking) : null;

  const properties = region
    ? await searchProperties({
        regionId: region.id,
        guests,
        maxWalkingMinutes: maxWalking ?? undefined,
      })
    : [];

  const detailQuery = new URLSearchParams();
  if (query.checkin) detailQuery.set("checkin", query.checkin);
  if (query.checkout) detailQuery.set("checkout", query.checkout);
  detailQuery.set("guests", String(guests));

  const rawFaqGroups = tFaq.raw("groups") as FaqGroup[];
  const faqGroups: FaqGroup[] = rawFaqGroups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      q: item.q,
      a: item.a
        .replace("{phone}", CONTACT_PHONE_DISPLAY)
        .replace("{email}", CONTACT_EMAIL),
    })),
  }));

  return (
    <div className="flex flex-col">
      <section className="border-b border-[#E5DED3] bg-background">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-10 sm:py-14">
          <div className="flex flex-col gap-2 sm:gap-2.5">
            <h1 className="font-serif-brand text-2xl font-bold leading-tight text-ink sm:text-[42px]">
              {t("title")}
            </h1>
            <p className="max-w-[560px] text-[13px] text-[#5C5349] sm:text-[17px]">
              {t("about")}
            </p>
          </div>

          <SearchForm regions={regions} holidays={holidays} />

          <div className="mt-4 sm:mt-6">
            <SearchFilters
              region={region?.slug ?? regions[0]?.slug ?? ""}
              checkin={query.checkin}
              checkout={query.checkout}
              guests={guests}
              activeMaxWalking={maxWalking}
            />
          </div>
        </div>
      </section>

      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-10 sm:py-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
            <h2 className="text-base font-bold text-ink sm:text-xl">
              {t("resultsCount", { count: properties.length })}
            </h2>
            <div className="flex items-center gap-4">
              <FavoritesButton />
              <div className="hidden items-center gap-2 text-sm text-[#5C5349] sm:flex">
                <span>{t("sortLabel")}</span>
                <span className="font-semibold text-ink">
                  {t("sortByDistance")}
                </span>
              </div>
            </div>
          </div>

          {properties.length === 0 ? (
            <p className="text-[#5C5349]">{tSearch("noResults")}</p>
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

      <HowItWorksSection />

      <section id="faq" className="border-t border-border-soft">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-10 sm:py-14">
          <h2 className="font-serif-brand text-2xl font-bold text-ink sm:text-3xl">
            {nav("faq")}
          </h2>
          <p className="mt-2 max-w-[560px] text-sm text-text-secondary">
            {tFaq("intro")}
          </p>
          <div className="mt-6">
            <FaqAccordion groups={faqGroups} />
          </div>
        </div>
      </section>
    </div>
  );
}
