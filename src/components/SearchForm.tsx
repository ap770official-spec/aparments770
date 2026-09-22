"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
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

  function openCalendar(event: ReactMouseEvent<HTMLButtonElement>) {
    triggerRef.current = event.currentTarget;
    setIsCalendarOpen(true);
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

    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div
        ref={fieldRef}
        className="relative flex flex-col divide-y divide-black/15 rounded-3xl border border-black/15 sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0 sm:rounded-full"
      >
        <div className="flex flex-1 flex-col gap-0.5 px-5 py-2 text-sm">
          <span id="search-checkin-label" className="text-xs text-black/60">
            {t("checkin")}
          </span>
          <button
            type="button"
            onClick={openCalendar}
            aria-haspopup="dialog"
            aria-expanded={isCalendarOpen}
            aria-labelledby="search-checkin-label"
            className="bg-transparent text-start"
          >
            {range?.from ? toISODate(range.from) : t("checkin")}
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-0.5 px-5 py-2 text-sm">
          <span id="search-checkout-label" className="text-xs text-black/60">
            {t("checkout")}
          </span>
          <button
            type="button"
            onClick={openCalendar}
            aria-haspopup="dialog"
            aria-expanded={isCalendarOpen}
            aria-labelledby="search-checkout-label"
            className="bg-transparent text-start"
          >
            {range?.to ? toISODate(range.to) : t("checkout")}
          </button>
        </div>

        <label className="flex flex-1 flex-col gap-0.5 px-5 py-2 text-sm">
          <span className="text-xs text-black/60">{t("guests")}</span>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            required
            className="bg-transparent"
          />
        </label>

        <div className="flex items-center justify-center p-2 sm:ps-1">
          <button
            type="submit"
            disabled={!range?.from || !range?.to}
            aria-label={t("submit")}
            title={t("submit")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        {isCalendarOpen && (
          <div className="absolute top-full z-10 mt-1 rounded-md border border-black/15 bg-background p-2 shadow-lg">
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
            <p className="text-xs text-black/60">
              {!range?.from ? t("selectCheckin") : t("selectCheckout")}
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
