"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  he: "עברית",
  en: "English",
};

export default function Header() {
  const t = useTranslations("header");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const navItems = [
    { href: "/how-it-works", label: nav("howItWorks") },
    { href: "/faq", label: nav("faq") },
  ] as const;

  return (
    <header className="border-b border-black/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-serif-brand text-lg font-semibold text-brand"
        >
          Apartments770
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {routing.locales.map((loc, index) => (
              <span key={loc} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="opacity-40">
                    /
                  </span>
                )}
                {loc === locale ? (
                  <span className="font-semibold" aria-current="true">
                    {localeLabels[loc]}
                  </span>
                ) : (
                  <Link
                    href={pathname}
                    locale={loc}
                    className="underline-offset-4 hover:underline"
                    aria-label={t("switchLanguage")}
                  >
                    {localeLabels[loc]}
                  </Link>
                )}
              </span>
            ))}
          </div>

          <Link
            href="/list-property"
            className="hidden rounded-full border border-black/15 px-4 py-1.5 text-sm sm:inline-block"
          >
            {t("landlordLogin")}
          </Link>
          <Link
            href="/list-property"
            aria-label={t("landlordLogin")}
            title={t("landlordLogin")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 sm:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </Link>
        </div>
      </div>

      <nav className="border-t border-black/10">
        <ul className="mx-auto flex max-w-5xl items-center gap-5 px-4 py-2 text-sm text-black/70">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
