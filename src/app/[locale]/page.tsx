import { getTranslations, setRequestLocale } from "next-intl/server";
import { getActiveRegions } from "@/lib/regions";
import { getUpcomingHebrewHolidays } from "@/lib/hebrewHolidays";
import SearchForm from "@/components/SearchForm";

// Regions come from Supabase and can change (admin adds one) without a
// redeploy - render this per-request instead of baking the list in at
// build time.
export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const regions = await getActiveRegions();
  const holidays = getUpcomingHebrewHolidays();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-black/70 dark:text-white/70">{t("about")}</p>
      <SearchForm regions={regions} holidays={holidays} />
    </div>
  );
}
