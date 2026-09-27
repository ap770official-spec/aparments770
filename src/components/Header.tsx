"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { signOut } from "@/lib/authClient";

const localeLabels: Record<string, string> = {
  he: "עברית",
  en: "English",
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const t = useTranslations("header");
  const nav = useTranslations("nav");
  const accountMenu = useTranslations("accountMenu");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const accountMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/about", label: nav("about") },
    { href: "/articles", label: nav("articles") },
    { href: "/list-property", label: nav("listProperty") },
    { href: "/recommendations", label: nav("recommendations") },
    { href: "/contact", label: nav("contact") },
  ] as const;

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  async function handleLogout() {
    setIsAccountMenuOpen(false);
    await signOut();
    router.push("/owner/login");
    router.refresh();
  }

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

          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              aria-label={accountMenu("ariaLabel")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
              </svg>
            </button>

            {isAccountMenuOpen && (
              <div
                role="menu"
                className="absolute top-12 flex w-52 flex-col gap-0.5 rounded-xl border border-border-soft bg-background p-2 shadow-lg end-0"
              >
                <Link
                  href="/owner/dashboard"
                  onClick={() => setIsAccountMenuOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-black/5"
                >
                  {accountMenu("myApartments")}
                </Link>
                <Link
                  href="/list-property"
                  onClick={() => setIsAccountMenuOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-black/5"
                >
                  {accountMenu("publishApartment")}
                </Link>
                <div className="my-1 h-px bg-border-soft" />
                <button
                  type="button"
                  onClick={handleLogout}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-sm font-semibold text-text-faint hover:bg-black/5"
                >
                  {accountMenu("logout")}
                </button>
              </div>
            )}
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
