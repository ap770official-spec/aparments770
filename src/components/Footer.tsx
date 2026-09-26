import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-black/10">
      <div className="mx-auto flex max-w-5xl flex-col-reverse items-center justify-between gap-3 px-4 py-4 text-sm text-black/60 sm:flex-row">
        <p>{t("copyright")}</p>
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
