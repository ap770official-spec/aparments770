import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/brand/Logo";

export default async function Footer() {
  const t = await getTranslations("footer");
  const site = await getTranslations("site");

  return (
    <footer className="border-t border-black/10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-black/60 sm:flex-row">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/"
            className="rounded-md text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <LogoMark
              withNumerals
              weight={1.4}
              title={site("name")}
              className="h-14 w-auto"
            />
          </Link>
          <p>{t("copyright")}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="hover:underline">
            {t("contact")}
          </Link>
          <Link href="/terms" className="hover:underline">
            {t("terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
