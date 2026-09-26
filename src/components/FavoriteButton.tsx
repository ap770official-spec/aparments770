"use client";

import { useTranslations } from "next-intl";
import { useFavorites } from "@/lib/favorites";

const HEART_PATH =
  "M12.1 21.35l-1.1-1.02C5.14 15.24 2 12.39 2 8.75 2 5.99 4.2 3.75 7 3.75c1.74 0 3.41.81 4.5 2.09A5.98 5.98 0 0 1 16 3.75c2.8 0 5 2.24 5 5 0 3.64-3.14 6.49-8.9 11.59l-.1.01z";

export default function FavoriteButton({
  propertyId,
  className,
}: {
  propertyId: string;
  className?: string;
}) {
  const t = useTranslations("favorites");
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(propertyId);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(propertyId);
      }}
      aria-pressed={active}
      aria-label={active ? t("remove") : t("add")}
      title={active ? t("remove") : t("add")}
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-full bg-background/85 shadow"
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        aria-hidden="true"
        className={active ? "text-red-500" : "text-black/50"}
      >
        <path d={HEART_PATH} />
      </svg>
    </button>
  );
}
