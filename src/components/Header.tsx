"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const localeLabels: Record<string, string> = {
  he: "עברית",
  en: "English",
};

export default function Header() {
  const t = useTranslations("header");
  const nav = useTranslations("nav");
  const dashboard = useTranslations("dashboard");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push("/owner/login");
    router.refresh();
  }

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

          {isLoggedIn ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label={t("personalArea")}
                title={t("personalArea")}
                className="flex h-9 items-center gap-2 rounded-full border border-black/15 px-3 text-xl leading-none"
              >
                <span aria-hidden="true">☰</span>
                <span className="hidden text-sm sm:inline">
                  {t("personalArea")}
                </span>
              </button>

              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute end-0 top-full z-10 mt-1 w-48 rounded-md border border-black/15 bg-background py-1 text-sm shadow-lg"
                >
                  <Link
                    href="/owner/properties/new"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 hover:bg-black/5"
                  >
                    {t("newListing")}
                  </Link>
                  <Link
                    href="/owner/dashboard"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 hover:bg-black/5"
                  >
                    {dashboard("myProperties")}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="block w-full border-t border-black/10 px-4 py-2 text-start hover:bg-black/5"
                  >
                    {dashboard("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
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
