import { getTranslations, setRequestLocale } from "next-intl/server";
import ComingSoonPage from "@/components/ComingSoonPage";

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  return <ComingSoonPage title={t("articles")} />;
}
