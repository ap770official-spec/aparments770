"use client";

import {
  useEffect,
  useId,
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
import type { HolidayMarker } from "@/lib/hebrewHolidays";
import { formatDisplayDate, formatShortDate } from "@/lib/displayDate";

const MAX_GUESTS = 20;
const SEARCH_WINDOW_DAYS = 365;

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function nightsBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** A modal dialog doesn't stop the page behind it from scrolling. */
function setPageScrollLocked(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

function GuestStepper({
  guests,
  onChange,
  compact = false,
}: {
  guests: number;
  onChange: (guests: number) => void;
  compact?: boolean;
}) {
  const t = useTranslations("property");
  const size = compact ? "h-9 w-9" : "h-11 w-11";
  const stepClass = `flex ${size} items-center justify-center rounded-full border border-line text-ink transition-colors duration-150 [@media(hover:hover)]:hover:border-ink disabled:pointer-events-none disabled:opacity-35`;
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, guests - 1))}
        disabled={guests <= 1}
        aria-label={t("guestsDecrease")}
        className={stepClass}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange(Math.min(MAX_GUESTS, guests + 1))}
        disabled={guests >= MAX_GUESTS}
        aria-label={t("guestsIncrease")}
        className={stepClass}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

/** The range calendar, without availability (it spans many listings). */
function SearchCalendar({
  range,
  onSelect,
  holidays,
  months,
}: {
  range: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  holidays: HolidayMarker[];
  months: 1 | 2;
}) {
  const locale = useLocale();
  const holidayNameByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of holidays) map.set(h.date, locale === "he" ? h.nameHe : h.nameEn);
    return map;
  }, [holidays, locale]);
  const holidayDates = useMemo(
    () => holidays.map((h) => new Date(`${h.date}T00:00:00`)),
    [holidays],
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = new Date(today);
  lastDay.setDate(lastDay.getDate() + SEARCH_WINDOW_DAYS);

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={(next) => {
        // A same-day "range" isn't a stay: keep it as a check-in only.
        if (next?.from && next.to && next.from.getTime() === next.to.getTime()) {
          onSelect({ from: next.from, to: undefined });
        } else {
          onSelect(next);
        }
      }}
      resetOnSelect
      numberOfMonths={months}
      disabled={[{ before: today }, { after: lastDay }]}
      startMonth={today}
      endMonth={lastDay}
      defaultMonth={range?.from ?? today}
      locale={locale === "he" ? heLocale : enLocale}
      dir={locale === "he" ? "rtl" : "ltr"}
      modifiers={{ holiday: holidayDates }}
      modifiersClassNames={{ holiday: "rdp-holiday" }}
      components={{
        DayButton: (props) => (
          <DefaultDayButton
            {...props}
            title={holidayNameByDate.get(toISODate(props.day.date))}
          />
        ),
      }}
    />
  );
}

export default function SearchForm({
  defaultRegionSlug,
  holidays,
  initialCheckin,
  initialCheckout,
  initialGuests,
  currentQuery = "",
}: {
  defaultRegionSlug: string;
  holidays: HolidayMarker[];
  initialCheckin?: string;
  initialCheckout?: string;
  initialGuests?: number;
  /** The page's current query, so a new search keeps distance/filters. */
  currentQuery?: string;
}) {
  const t = useTranslations("searchForm");
  const tProperty = useTranslations("property");
  const locale = useLocale();
  const router = useRouter();

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = parseISODate(initialCheckin);
    const to = parseISODate(initialCheckout);
    return from ? { from, to: to && to > from ? to : undefined } : undefined;
  });
  const [guests, setGuests] = useState(
    Math.min(MAX_GUESTS, Math.max(1, initialGuests ?? 1)),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const sheetTitleId = useId();
  const hasRange = Boolean(range?.from && range?.to);

  // Desktop popover: close on outside pointer or Escape.
  useEffect(() => {
    if (!isCalendarOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) setIsCalendarOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsCalendarOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isCalendarOpen]);

  useEffect(() => () => setPageScrollLocked(false), []);

  function search() {
    if (!range?.from || !range?.to) return;
    const params = new URLSearchParams(currentQuery);
    params.set("region", params.get("region") || defaultRegionSlug);
    params.set("checkin", toISODate(range.from));
    params.set("checkout", toISODate(range.to));
    params.set("guests", String(guests));
    router.push(`/?${params.toString()}`);
  }

  function openSheet() {
    setPageScrollLocked(true);
    sheetRef.current?.showModal();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Searching without dates opens the picker instead of doing nothing.
    if (!hasRange) {
      if (window.matchMedia("(min-width: 640px)").matches) setIsCalendarOpen(true);
      else openSheet();
      return;
    }
    search();
  }

  function handleRangeSelect(next: DateRange | undefined) {
    setRange(next);
    if (next?.from && next?.to) setIsCalendarOpen(false);
  }

  const hint = !range?.from
    ? t("selectCheckin")
    : !range.to
      ? t("selectCheckout")
      : `${formatShortDate(range.from, locale)} – ${formatShortDate(range.to, locale)} · ${tProperty("nightsCount", { count: nightsBetween(range.from, range.to) })}`;

  const datesSummary = range?.from
    ? range.to
      ? `${formatShortDate(range.from, locale)} – ${formatShortDate(range.to, locale)}`
      : `${formatShortDate(range.from, locale)} – ${tProperty("addDate")}`
    : tProperty("addDates");

  return (
    <form onSubmit={handleSubmit} className="mt-8 sm:max-w-[780px]">
      {/* ---------- Mobile: compact card, picking happens in a sheet ---------- */}
      <div className="overflow-hidden rounded-2xl border border-ink shadow-[0_2px_14px_rgba(26,21,18,0.05)] sm:hidden">
        <button
          type="button"
          onClick={openSheet}
          aria-haspopup="dialog"
          className="flex min-h-16 w-full items-center gap-3 border-b border-line px-4 py-3 text-start active:bg-canvas"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-ink">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold text-ink-soft">{t("dates")}</span>
            <span className={`truncate text-[15px] font-semibold ${range?.from ? "text-ink" : "text-ink-soft"}`}>
              {datesSummary}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={openSheet}
          aria-haspopup="dialog"
          className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-start active:bg-canvas"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-ink">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
          </svg>
          <span className="flex flex-col">
            <span className="text-xs font-semibold text-ink-soft">{t("guests")}</span>
            <span className="text-[15px] font-semibold text-ink">
              {tProperty("datesGuestsValue", { count: guests })}
            </span>
          </span>
        </button>
        <button
          type="submit"
          className="flex h-13 min-h-12 w-full items-center justify-center gap-2 bg-brand text-base font-bold text-brand-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          {t("submit")}
        </button>
      </div>

      <dialog
        ref={sheetRef}
        aria-labelledby={sheetTitleId}
        onClose={() => setPageScrollLocked(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-ink translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop:bg-black/40 starting:translate-y-full motion-reduce:transition-opacity motion-reduce:starting:translate-y-0 motion-reduce:starting:opacity-0 sm:hidden"
      >
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex shrink-0 flex-col gap-2 px-4 pt-3">
            <span className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3">
              <h2 id={sheetTitleId} className="text-lg font-bold">
                {tProperty("bookingTitle")}
              </h2>
              <button
                type="button"
                onClick={() => sheetRef.current?.close()}
                aria-label={tProperty("contactClose")}
                className="-me-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-canvas"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain px-4 pb-3">
            <p className="min-h-6 w-full pb-1 text-[14px] font-semibold" aria-live="polite">
              {hint}
            </p>
            <SearchCalendar range={range} onSelect={setRange} holidays={holidays} months={1} />
            <div className="mt-3 flex w-full items-center justify-between gap-3 rounded-[10px] border border-line px-3.5 py-2">
              <span className="flex flex-col">
                <span className="text-xs font-semibold text-ink-soft">{t("guests")}</span>
                <span className="text-[15px]">{tProperty("datesGuestsValue", { count: guests })}</span>
              </span>
              <GuestStepper guests={guests} onChange={setGuests} />
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {range?.from ? (
              <button
                type="button"
                onClick={() => setRange(undefined)}
                className="py-2 text-[15px] font-semibold underline underline-offset-4"
              >
                {tProperty("clearDates")}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={!hasRange}
              onClick={() => {
                sheetRef.current?.close();
                search();
              }}
              className="flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-brand px-7 text-base font-bold text-brand-foreground disabled:bg-line disabled:text-ink-soft"
            >
              {t("submit")}
            </button>
          </div>
        </div>
      </dialog>

      {/* ---------- Desktop: pill with a calendar popover ---------- */}
      <div ref={fieldRef} className="relative hidden sm:block">
        <div className="flex items-stretch divide-x divide-line rounded-full border border-ink shadow-[0_2px_14px_rgba(26,21,18,0.05)] rtl:divide-x-reverse">
          {(["checkin", "checkout"] as const).map((field) => {
            const date = field === "checkin" ? range?.from : range?.to;
            return (
              <button
                key={field}
                type="button"
                onClick={() => setIsCalendarOpen((open) => !open)}
                aria-expanded={isCalendarOpen}
                aria-haspopup="dialog"
                className="flex min-h-16 flex-1 flex-col justify-center gap-0.5 px-6 text-start first:rounded-s-full [@media(hover:hover)]:hover:bg-canvas"
              >
                <span className="text-xs font-semibold text-ink-soft">{t(field)}</span>
                <span className={`text-[15px] ${date ? "font-semibold text-ink" : "text-ink-soft"}`}>
                  {date ? formatDisplayDate(date, locale) : tProperty("addDate")}
                </span>
              </button>
            );
          })}
          <div className="flex flex-[1.35] items-center justify-between gap-3 ps-6 pe-2">
            <span className="flex flex-col gap-0.5 whitespace-nowrap">
              <span className="text-xs font-semibold text-ink-soft">{t("guests")}</span>
              <span className="text-[15px] font-semibold text-ink">
                {tProperty("datesGuestsValue", { count: guests })}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <GuestStepper guests={guests} onChange={setGuests} compact />
              <button
                type="submit"
                aria-label={t("submit")}
                title={t("submit")}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-[filter] duration-150 hover:brightness-110"
              >
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </span>
          </div>
        </div>

        {isCalendarOpen && (
          <div className="absolute start-0 top-full z-30 mt-2 flex origin-top flex-col rounded-2xl border border-line bg-white p-3 shadow-[0_8px_32px_rgba(26,21,18,0.14)] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] starting:scale-[0.97] starting:opacity-0">
            <p className="min-h-6 px-2 pb-1 text-[14px] font-semibold text-ink" aria-live="polite">
              {hint}
            </p>
            <SearchCalendar range={range} onSelect={handleRangeSelect} holidays={holidays} months={2} />
            {range?.from && (
              <button
                type="button"
                onClick={() => setRange(undefined)}
                className="self-start px-2 py-2 text-[13px] font-semibold text-ink underline underline-offset-2"
              >
                {tProperty("clearDates")}
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
