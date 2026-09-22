import { getTranslations } from "next-intl/server";

export default async function ComingSoonPage({ title }: { title: string }) {
  const t = await getTranslations("comingSoon");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-black/70">
        {t("title")} — {t("body")}
      </p>
    </div>
  );
}
