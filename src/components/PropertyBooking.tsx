"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DayPicker,
  DayButton as DefaultDayButton,
  type DateRange,
  type Matcher,
} from "react-day-picker";
import { he as heLocale, enUS as enLocale } from "react-day-picker/locale";
import "react-day-picker/style.css";
import {
  buildWhatsAppLink,
  buildTelLink,
  formatPhoneForDisplay,
} from "@/lib/whatsapp";
import {
  ContactInline,
  ContactSheetButton,
  type ContactDetails,
} from "@/components/ContactOptions";
import type { HolidayMarker } from "@/lib/hebrewHolidays";

const DAY_MS = 24 * 60 * 60 * 1000;

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

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function nightsBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

// Hebrew numerals for a day of the month (1-30), e.g. 15 -> ט״ו.
function gematriyaDay(day: number): string {
  if (day === 15) return "ט״ו";
  if (day === 16) return "ט״ז";
  const tens = ["", "י", "כ", "ל"][Math.floor(day / 10)];
  const units = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"][day % 10];
  const letters = tens + units;
  return letters.length === 1
    ? `${letters}׳`
    : `${letters.slice(0, -1)}״${letters.slice(-1)}`;
}

/**
 * Hebrew-calendar date ("כ״ג תשרי") in Hebrew, short Gregorian in English -
 * the same convention the page used before, without shipping @hebcal to the
 * browser (Intl already knows the Hebrew calendar).
 */
function formatDisplayDate(date: Date, locale: string): string {
  if (locale !== "he") {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  const parts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
    day: "numeric",
    month: "long",
  }).formatToParts(date);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const weekday = date.toLocaleDateString("he-IL", { weekday: "short" });
  return `${weekday} ${gematriyaDay(day)} ${month}`;
}

/** Unambiguous Gregorian date for the WhatsApp message to the owner. */
function formatMessageDate(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

type BookingState = {
  range: DateRange | undefined;
  setRange: (range: DateRange | undefined) => void;
  guests: number;
  setGuests: (guests: number) => void;
  nights: number;
  total: number;
  pricePerNight: number;
  maxGuests: number;
  minNights: number;
  holidays: HolidayMarker[];
  contact: ContactDetails;
};

const BookingContext = createContext<BookingState | null>(null);

function useBooking(): BookingState {
  const state = useContext(BookingContext);
  if (!state) throw new Error("useBooking must be used inside BookingProvider");
  return state;
}

export function BookingProvider({
  children,
  address,
  pricePerNight,
  maxGuests,
  minNights,
  phoneCountryCode,
  phoneNumber,
  holidays,
  initialCheckin,
  initialCheckout,
  initialGuests,
}: {
  children: ReactNode;
  address: string;
  pricePerNight: number;
  maxGuests: number | null;
  minNights: number | null;
  phoneCountryCode: string;
  phoneNumber: string;
  holidays: HolidayMarker[];
  initialCheckin?: string;
  initialCheckout?: string;
  initialGuests?: string;
}) {
  const t = useTranslations("property");
  const guestCap = maxGuests ?? 20;

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = parseISODate(initialCheckin);
    const to = parseISODate(initialCheckout);
    if (!from) return undefined;
    return { from, to: to && to > from ? to : undefined };
  });
  const [guests, setGuests] = useState(() => {
    const parsed = Number(initialGuests);
    return Number.isInteger(parsed) && parsed >= 1
      ? Math.min(parsed, guestCap)
      : 1;
  });

  const nights =
    range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
  const total = nights * pricePerNight;

  // Keep the address bar in step so a shared or reloaded link keeps the
  // visitor's dates. history.replaceState instead of router.replace: a
  // router navigation would re-render this force-dynamic page on the server
  // (database + Mapbox calls) for what is purely client state.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (range?.from && range?.to) {
      url.searchParams.set("checkin", toISODate(range.from));
      url.searchParams.set("checkout", toISODate(range.to));
      url.searchParams.set("guests", String(guests));
    } else {
      url.searchParams.delete("checkin");
      url.searchParams.delete("checkout");
      url.searchParams.delete("guests");
    }
    if (url.href !== window.location.href) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [range, guests]);

  const whatsappLink = buildWhatsAppLink({
    countryCode: phoneCountryCode,
    phoneNumber,
    message:
      range?.from && range?.to
        ? t("whatsappMessage", {
            address,
            checkin: formatMessageDate(range.from),
            checkout: formatMessageDate(range.to),
            guests,
          })
        : t("whatsappMessageGeneric", { address }),
  });

  return (
    <BookingContext.Provider
      value={{
        range,
        setRange,
        guests,
        setGuests,
        nights,
        total,
        pricePerNight,
        maxGuests: guestCap,
        minNights: Math.max(1, minNights ?? 1),
        holidays,
        contact: {
          whatsappLink,
          telLink: buildTelLink(phoneCountryCode, phoneNumber),
          phoneDisplay: formatPhoneForDisplay(phoneCountryCode, phoneNumber),
          hasStayDetails: nights > 0,
        },
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

function formatPrice(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

function GuestStepper() {
  const t = useTranslations("property");
  const { guests, setGuests, maxGuests } = useBooking();
  const stepClass =
    "flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors duration-150 hover:border-ink disabled:pointer-events-none disabled:opacity-35";

  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2">
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-ink-soft">
          {t("datesGuestsLabel")}
        </span>
        <span className="text-[15px] text-ink" aria-live="polite">
          {t("datesGuestsValue", { count: guests })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setGuests(Math.max(1, guests - 1))}
          disabled={guests <= 1}
          aria-label={t("guestsDecrease")}
          className={stepClass}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
          disabled={guests >= maxGuests}
          aria-label={t("guestsIncrease")}
          className={stepClass}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function DateFields({ idPrefix }: { idPrefix: string }) {
  const t = useTranslations("property");
  const locale = useLocale();
  const { range, setRange, minNights, holidays } = useBooking();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarId = `${idPrefix}-calendar`;

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const disabled: Matcher[] = [{ before: today }];
  // While picking check-out, block the nights that would fall under the
  // listing's minimum stay.
  if (range?.from && !range.to && minNights > 1) {
    disabled.push({
      after: range.from,
      before: addDays(range.from, minNights),
    });
  }

  function handleSelect(next: DateRange | undefined) {
    if (next?.from && next.to && next.from.getTime() === next.to.getTime()) {
      setRange({ from: next.from, to: undefined });
      return;
    }
    setRange(next);
    if (next?.from && next?.to) setIsCalendarOpen(false);
  }

  const fieldClass =
    "flex min-h-14 flex-col items-start justify-center gap-0.5 px-3.5 py-2 text-start transition-colors duration-150 hover:bg-canvas";

  return (
    <div className="flex flex-col">
      <div className="overflow-hidden rounded-[10px] border border-line">
        <div className="grid grid-cols-2 border-b border-line">
          {(["checkin", "checkout"] as const).map((field) => {
            const date = field === "checkin" ? range?.from : range?.to;
            return (
              <button
                key={field}
                type="button"
                onClick={() => setIsCalendarOpen((open) => !open)}
                aria-expanded={isCalendarOpen}
                aria-controls={calendarId}
                className={`${fieldClass} ${field === "checkin" ? "border-e border-line" : ""}`}
              >
                <span className="text-xs font-semibold text-ink-soft">
                  {t(field === "checkin" ? "datesCheckin" : "datesCheckout")}
                </span>
                <span
                  className={`text-[15px] ${date ? "text-ink" : "text-ink-soft"}`}
                >
                  {date ? formatDisplayDate(date, locale) : t("addDate")}
                </span>
              </button>
            );
          })}
        </div>
        <GuestStepper />
      </div>

      {isCalendarOpen && (
        <div
          id={calendarId}
          className="mt-2 flex flex-col items-center rounded-[10px] border border-line p-2"
        >
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            resetOnSelect
            disabled={disabled}
            startMonth={today}
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
          <div className="flex w-full items-center justify-between gap-3 px-2 pb-1 pt-2">
            <span className="text-[13px] text-ink-soft" aria-live="polite">
              {!range?.from
                ? t("selectCheckin")
                : !range.to
                  ? minNights > 1
                    ? t("selectCheckoutMin", { count: minNights })
                    : t("selectCheckout")
                  : null}
            </span>
            {range?.from && (
              <button
                type="button"
                onClick={() => setRange(undefined)}
                className="shrink-0 py-2 text-[13px] font-semibold text-ink underline underline-offset-2"
              >
                {t("clearDates")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceSummary() {
  const t = useTranslations("property");
  const { nights, total, pricePerNight } = useBooking();
  if (nights === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 text-[15px] text-ink">
      <div className="flex items-center justify-between gap-3">
        <span>
          {t("nightsLine", { price: formatPrice(pricePerNight), nights })}
        </span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5 font-bold">
        <span>{t("totalLabel")}</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>
    </div>
  );
}

function PerNight({ large = false }: { large?: boolean }) {
  const t = useTranslations("property");
  const { pricePerNight } = useBooking();
  return (
    <div className="flex items-baseline gap-1">
      <span
        className={`font-bold text-ink ${large ? "text-2xl" : "text-xl"}`}
      >
        {formatPrice(pricePerNight)}
      </span>
      <span className="text-sm text-ink-soft">{t("perNightSuffix")}</span>
    </div>
  );
}

/** Desktop: sticky side card. */
export function BookingCard() {
  const t = useTranslations("property");
  const { contact } = useBooking();

  return (
    <div className="sticky top-6 flex flex-col gap-4 rounded-2xl border border-line p-6 shadow-[0_4px_24px_rgba(26,21,18,0.08)]">
      <PerNight large />
      <DateFields idPrefix="booking-desktop" />
      <PriceSummary />
      <ContactInline details={contact} />
      <span className="text-center text-xs leading-relaxed text-ink-soft">
        {t("bookingNote")}
      </span>
    </div>
  );
}

/** Mobile: in-flow dates/guests section near the top of the page. */
export function MobileBookingSection() {
  const t = useTranslations("property");
  return (
    <section
      aria-labelledby="booking-mobile-title"
      className="flex flex-col gap-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="booking-mobile-title"
          className="text-lg font-bold text-ink"
        >
          {t("bookingTitle")}
        </h2>
        <PerNight />
      </div>
      <DateFields idPrefix="booking-mobile" />
      <PriceSummary />
    </section>
  );
}

/** Mobile: fixed bottom bar with the price (or stay total) and WhatsApp. */
export function MobileBookingBar() {
  const t = useTranslations("property");
  const { contact, nights, total, pricePerNight } = useBooking();

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <div className="flex flex-col leading-tight">
        <span className="text-base font-bold text-ink tabular-nums">
          {formatPrice(nights > 0 ? total : pricePerNight)}
        </span>
        <span className="text-xs text-ink-soft">
          {nights > 0
            ? t("totalForNights", { nights })
            : t("perNightSuffix")}
        </span>
      </div>
      <ContactSheetButton
        details={contact}
        className="flex min-h-12 flex-1 items-center justify-center rounded-[10px] bg-brand px-3 py-3 text-[15px] font-bold text-brand-foreground"
      />
    </div>
  );
}
