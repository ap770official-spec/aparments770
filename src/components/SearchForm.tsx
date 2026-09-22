"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DayPicker,
  DayButton as DefaultDayButton,
  type DateRange,
} from "react-day-picker";
import { he as heLocale, enUS as enLocale } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { useRouter } from "@/i18n/navigation";
import type { Region } from "@/lib/regions";
import type { HolidayMarker } from "@/lib/hebrewHolidays";

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function SearchForm({
  regions,
  holidays,
}: {
  regions: Region[];
  holidays: HolidayMarker[];
}) {
  const t = useTranslations("searchForm");
  const locale = useLocale();
  const router = useRouter();

  const region = regions[0]?.slug ?? "";
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const fieldRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const holidayNameByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of holidays) {
      map.set(h.date, locale === "he" ? h.nameHe : h.nameEn);
    }
    return map;
  }, [holidays, locale]);

  const holidayDates = useMemo(
    () => holidays.map((h) => new Date(`${h.date}T00:00:00`)),
    [holidays],
  );

  useEffect(() => {
    if (!isCalendarOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCalendarOpen]);

  function handleRangeSelect(newRange: DateRange | undefined) {
    setRange(newRange);
    if (newRange?.from && newRange?.to) {
      setIsCalendarOpen(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!range?.from || !range?.to) return;

    const params = new URLSearchParams({
      region,
      checkin: toISODate(range.from),
      checkout: toISODate(range.to),
      guests: String(guests),
    });

    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 grid gap-4 rounded-lg border border-black/10 p-4 sm:grid-cols-2 dark:border-white/15"
    >
      <div ref={fieldRef} className="relative flex flex-col gap-1 text-sm sm:col-span-2">
        <span id="search-dates-label">{t("dates")}</span>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsCalendarOpen((open) => !open)}
          aria-haspopup="dialog"
          aria-expanded={isCalendarOpen}
          aria-labelledby="search-dates-label"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-start dark:border-white/20"
        >
          {range?.from && range?.to
            ? `${t("checkin")}: ${toISODate(range.from)} · ${t("checkout")}: ${toISODate(range.to)}`
            : t("placeholder")}
        </button>

        {isCalendarOpen && (
          <div className="absolute top-full z-10 mt-1 rounded-md border border-black/15 bg-background p-2 shadow-lg dark:border-white/20">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              resetOnSelect
              locale={locale === "he" ? heLocale : enLocale}
              dir={locale === "he" ? "rtl" : "ltr"}
              modifiers={{ holiday: holidayDates }}
              modifiersClassNames={{ holiday: "rdp-holiday" }}
              components={{
                DayButton: (props) => {
                  const holidayName = holidayNameByDate.get(
                    toISODate(props.day.date),
                  );
                  return <DefaultDayButton {...props} title={holidayName} />;
                },
              }}
            />
            <p className="text-xs text-black/60 dark:text-white/60">
              {!range?.from ? t("selectCheckin") : t("selectCheckout")}
            </p>
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {t("guests")}
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <button
        type="submit"
        disabled={!range?.from || !range?.to}
        className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50 sm:col-span-2 sm:self-end"
      >
        {t("submit")}
      </button>
    </form>
  );
}
