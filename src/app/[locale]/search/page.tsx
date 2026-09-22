import { getTranslations, setRequestLocale } from "next-intl/server";
import { getRegionBySlug, regionLabel } from "@/lib/regions";
import { searchProperties } from "@/lib/properties";
import PropertyCard from "@/components/PropertyCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({
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
  const t = await getTranslations("search");
  const query = await searchParams;

  if (!query.region || !query.checkin || !query.checkout || !query.guests) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-black/70">
          {t("missingParams")}
        </p>
      </div>
    );
  }

  const region = await getRegionBySlug(query.region);
  const guests = Number(query.guests) || 1;

  const properties = region
    ? await searchProperties({ regionId: region.id, guests })
    : [];

  const searchQuery = new URLSearchParams({
    checkin: query.checkin,
    checkout: query.checkout,
    guests: query.guests,
  }).toString();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {region && (
        <p className="mt-1 text-black/70">
          {t("resultsFor", { region: regionLabel(region, locale), guests })}
        </p>
      )}

      {properties.length === 0 ? (
        <p className="mt-6 text-black/70">
          {t("noResults")}
        </p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              detailHref={`/property/${property.id}?${searchQuery}`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
