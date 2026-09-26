"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/lib/favorites";
import PropertyCard from "@/components/PropertyCard";
import type { PropertySummary } from "@/lib/properties";

export default function FavoritesButton() {
  const t = useTranslations("favorites");
  const { favoriteIds } = useFavorites();
  const [isOpen, setIsOpen] = useState(false);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (favoriteIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProperties([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/favorites?ids=${favoriteIds.join(",")}`)
      .then((res) => res.json())
      .then((data: { properties: PropertySummary[] }) => {
        if (!cancelled) setProperties(data.properties ?? []);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, favoriteIds]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm"
      >
        <span aria-hidden="true">♥</span>
        {t("myFavorites")}
        {favoriteIds.length > 0 && (
          <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-brand-foreground">
            {favoriteIds.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("myFavorites")}
          className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-12"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-lg bg-background p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("myFavorites")}</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t("close")}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            {isLoading ? (
              <p className="mt-6 text-black/70">{t("loading")}</p>
            ) : properties.length === 0 ? (
              <p className="mt-6 text-black/70">{t("empty")}</p>
            ) : (
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    detailHref={`/property/${property.id}`}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
