import { getTranslations, setRequestLocale } from "next-intl/server";
import FaqAccordion from "@/components/FaqAccordion";
import { CONTACT_PHONE_DISPLAY, CONTACT_EMAIL } from "@/lib/contactInfo";

type FaqItem = { q: string; a: string };
type FaqGroup = { title: string; items: FaqItem[] };

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tFaq = await getTranslations("faq");

  const rawGroups = tFaq.raw("groups") as FaqGroup[];
  const groups: FaqGroup[] = rawGroups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      q: item.q,
      a: item.a
        .replace("{phone}", CONTACT_PHONE_DISPLAY)
        .replace("{email}", CONTACT_EMAIL),
    })),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif-brand text-2xl font-bold text-ink sm:text-[30px]">
        {t("faq")}
      </h1>
      <p className="mt-2 max-w-[560px] text-sm text-ink-soft">
        {tFaq("intro")}
      </p>

      <div className="mt-8">
        <FaqAccordion groups={groups} />
      </div>
    </div>
  );
}
