"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  he: "עברית",
  en: "English",
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations("header");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const navItems = [
    { href: "/about", label: nav("about") },
    { href: "/articles", label: nav("articles") },
    { href: "/list-property", label: nav("listProperty") },
    { href: "/recommendations", label: nav("recommendations") },
    { href: "/contact", label: nav("contact") },
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

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-black/10 text-xl leading-none"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-black/10">
          <ul className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md px-2 py-2 hover:bg-black/5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
