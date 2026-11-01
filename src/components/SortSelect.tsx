"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { SORT_OPTIONS, type SortOption } from "@/lib/searchFilters";

/**
 * Result order. A native select: the platform picker is the best control
 * on phones, and it's fully accessible with no extra code.
 */
export default function SortSelect({
  value,
  currentQuery,
}: {
  value: SortOption;
  /** The page's current query string, so other params are kept. */
  currentQuery: string;
}) {
  const t = useTranslations("home");
  const router = useRouter();

  const labels: Record<SortOption, string> = {
    distance: t("sortByDistance"),
    price_asc: t("sortPriceAsc"),
    price_desc: t("sortPriceDesc"),
  };

  return (
    <label className="flex items-center gap-2 text-sm text-ink-soft">
      <span>{t("sortLabel")}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => {
            const params = new URLSearchParams(currentQuery);
            if (event.target.value === "distance") params.delete("sort");
            else params.set("sort", event.target.value);
            router.push(`/?${params.toString()}`, { scroll: false });
          }}
          className="min-h-10 appearance-none rounded-full border border-line bg-white ps-4 pe-9 text-sm font-semibold text-ink [@media(hover:hover)]:hover:border-ink"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {labels[option]}
            </option>
          ))}
        </select>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ink"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}
