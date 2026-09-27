"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const DISTANCE_OPTIONS: { key: string; minutes: number | null }[] = [
  { key: "all", minutes: null },
  { key: "5", minutes: 5 },
  { key: "10", minutes: 10 },
  { key: "15", minutes: 15 },
];

export default function SearchFilters({
  region,
  checkin,
  checkout,
  guests,
  activeMaxWalking,
}: {
  region: string;
  checkin?: string;
  checkout?: string;
  guests: number;
  activeMaxWalking: number | null;
}) {
  const t = useTranslations("home");
  const router = useRouter();

  function pick(minutes: number | null) {
    const params = new URLSearchParams({ region, guests: String(guests) });
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    if (minutes != null) params.set("maxWalking", String(minutes));
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-[13px] font-semibold text-[#8A8073]">
          {t("distanceLabel")}
        </span>
        {DISTANCE_OPTIONS.map((option) => {
          const active =
            option.minutes == null
              ? activeMaxWalking == null
              : activeMaxWalking === option.minutes;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => pick(option.minutes)}
              aria-pressed={active}
              className={
                active
                  ? "shrink-0 rounded-full border border-brand bg-brand px-4 py-2 text-sm font-semibold whitespace-nowrap text-brand-foreground"
                  : "shrink-0 rounded-full border border-[#E5DED3] px-4 py-2 text-sm font-semibold whitespace-nowrap text-ink"
              }
            >
              {t(
                option.key === "all"
                  ? "distanceAll"
                  : `distanceUpTo${option.key}`,
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden items-center gap-2.5 sm:flex">
        <span aria-hidden="true" className="h-5 w-px bg-[#E5DED3]" />
        <button
          type="button"
          className="rounded-full border border-[#E5DED3] px-4 py-2 text-sm text-ink"
        >
          {t("filterPrice")}
        </button>
        <button
          type="button"
          className="rounded-full border border-[#E5DED3] px-4 py-2 text-sm text-ink"
        >
          {t("filterRooms")}
        </button>
        <button
          type="button"
          className="rounded-full border border-[#E5DED3] px-4 py-2 text-sm text-ink"
        >
          {t("filterAmenities")}
        </button>
      </div>
    </div>
  );
}
