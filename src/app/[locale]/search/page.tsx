import { getTranslations, setRequestLocale } from "next-intl/server";
import { getActiveRegions } from "@/lib/regions";

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
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-black/70 dark:text-white/70">
          {t("missingParams")}
        </p>
      </div>
    );
  }

  const regions = await getActiveRegions();
  const region = regions.find((r) => r.slug === query.region);
  const regionLabel =
    locale === "he" ? region?.name_he : region?.name_en ?? region?.name_he;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-black/70 dark:text-white/70">{t("body")}</p>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-medium">{t("region")}</dt>
        <dd>{regionLabel ?? query.region}</dd>

        <dt className="font-medium">{t("checkin")}</dt>
        <dd>{query.checkin}</dd>

        <dt className="font-medium">{t("checkout")}</dt>
        <dd>{query.checkout}</dd>

        <dt className="font-medium">{t("guests")}</dt>
        <dd>{query.guests}</dd>
      </dl>
    </div>
  );
}
