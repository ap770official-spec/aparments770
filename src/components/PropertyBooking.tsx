"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
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
import { formatDisplayDate, formatShortDate } from "@/lib/displayDate";
import { useBottomSheet } from "@/lib/useBottomSheet";
import type { AvailabilityMode } from "@/lib/properties";
import type { AvailabilityStatus } from "@/lib/availability";

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
  /** Whether the night starting on this YYYY-MM-DD date can be booked. */
  isNightAvailable: (isoDate: string) => boolean;
  /** Last date the calendar offers (end of the loaded availability window). */
  lastBookableDate: Date;
  /** Why dates that came in the URL (e.g. from homepage search) were dropped. */
  droppedDatesReason: "unavailable" | "minNights" | null;
  clearDroppedDatesReason: () => void;
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
  availabilityMode,
  availabilityExceptions,
  availabilityUntil,
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
  availabilityMode: AvailabilityMode;
  /** Owner-marked nights (date -> status) from today to availabilityUntil. */
  availabilityExceptions: Record<string, AvailabilityStatus>;
  /** YYYY-MM-DD, exclusive end of the loaded window. */
  availabilityUntil: string;
}) {
  const t = useTranslations("property");
  const guestCap = maxGuests ?? 20;
  const effectiveMinNights = Math.max(1, minNights ?? 1);

  // Same rule as isAvailableForNights in lib/availability (used by search):
  // open-by-default listings lose only "blocked" nights, closed-by-default
  // listings offer only "open" ones.
  const isNightAvailable = (isoDate: string): boolean =>
    availabilityMode === "default_open_block_dates"
      ? availabilityExceptions[isoDate] !== "blocked"
      : availabilityMode === "default_closed_open_dates"
        ? availabilityExceptions[isoDate] === "open"
        : false;

  // Dates arriving in the URL are checked against this listing before being
  // used, so a stale or mismatched search never pre-fills an impossible stay.
  const [initial] = useState(() => {
    const from = parseISODate(initialCheckin);
    const to = parseISODate(initialCheckout);
    if (!from) {
      return { range: undefined, dropped: null } as const;
    }
    if (!to || to <= from) {
      return { range: { from, to: undefined }, dropped: null } as const;
    }
    const stay = nightsBetween(from, to);
    for (let i = 0; i < stay; i++) {
      if (!isNightAvailable(toISODate(addDays(from, i)))) {
        return { range: undefined, dropped: "unavailable" } as const;
      }
    }
    if (stay < effectiveMinNights) {
      return { range: undefined, dropped: "minNights" } as const;
    }
    return { range: { from, to }, dropped: null } as const;
  });
  const [range, setRangeState] = useState<DateRange | undefined>(
    initial.range,
  );
  const [droppedDatesReason, setDroppedDatesReason] = useState<
    "unavailable" | "minNights" | null
  >(initial.dropped);

  function setRange(next: DateRange | undefined) {
    setRangeState(next);
    setDroppedDatesReason(null);
  }
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
        minNights: effectiveMinNights,
        holidays,
        isNightAvailable,
        lastBookableDate: addDays(parseISODate(availabilityUntil)!, -1),
        droppedDatesReason,
        clearDroppedDatesReason: () => setDroppedDatesReason(null),
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

function DroppedDatesNotice({ className = "" }: { className?: string }) {
  const t = useTranslations("property");
  const { droppedDatesReason, minNights } = useBooking();
  if (!droppedDatesReason) return null;
  return (
    <p
      role="status"
      className={`rounded-[10px] border border-[#E8C9A0] bg-[#FBF3E8] px-3.5 py-2.5 text-[14px] leading-relaxed text-ink ${className}`}
    >
      {droppedDatesReason === "unavailable"
        ? t("searchDatesUnavailable")
        : t("searchDatesTooShort", { count: minNights })}
    </p>
  );
}

/**
 * The range picker itself, with its availability rules, legend and hint.
 * Shared by the desktop card (inline) and the mobile dates sheet.
 */
function StayCalendar({
  id,
  onRangeComplete,
}: {
  id: string;
  onRangeComplete?: () => void;
}) {
  const t = useTranslations("property");
  const locale = useLocale();
  const {
    range,
    setRange,
    minNights,
    holidays,
    isNightAvailable,
    lastBookableDate,
  } = useBooking();

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
  const pickingCheckout = Boolean(range?.from && !range.to);

  // While picking check-out, the stay can run up to the first taken night:
  // checking out that morning is fine, staying through it is not.
  let lastCheckout: Date | undefined;
  if (pickingCheckout && range?.from) {
    for (
      let night = addDays(range.from, 1);
      night <= lastBookableDate;
      night = addDays(night, 1)
    ) {
      if (!isNightAvailable(toISODate(night))) {
        lastCheckout = night;
        break;
      }
    }
  }
  const noValidCheckout =
    pickingCheckout &&
    range?.from != null &&
    lastCheckout != null &&
    nightsBetween(range.from, lastCheckout) < minNights;

  const disabled: Matcher[] = [
    { before: today },
    { after: lastBookableDate },
    (date: Date) => {
      if (pickingCheckout && range?.from && date > range.from) {
        return lastCheckout != null && date > lastCheckout;
      }
      // Choosing a check-in (or a day before the current one, which
      // restarts the range): the night itself must be free.
      return !isNightAvailable(toISODate(date));
    },
  ];
  // While picking check-out, block the nights that would fall under the
  // listing's minimum stay.
  if (pickingCheckout && range?.from && minNights > 1) {
    disabled.push({
      after: range.from,
      before: addDays(range.from, minNights),
    });
  }
  // The first taken night is still a valid check-out, so it isn't struck
  // through while the visitor is choosing one.
  const bookedNights = (date: Date) =>
    date >= today &&
    !isNightAvailable(toISODate(date)) &&
    !(lastCheckout && date.getTime() === lastCheckout.getTime());

  function handleSelect(next: DateRange | undefined) {
    if (next?.from && next.to && next.from.getTime() === next.to.getTime()) {
      setRange({ from: next.from, to: undefined });
      return;
    }
    setRange(next);
    if (next?.from && next?.to) onRangeComplete?.();
  }

  const hint = !range?.from
    ? t("selectCheckin")
    : !range.to
      ? noValidCheckout
        ? t("notEnoughFreeNights", { count: minNights })
        : minNights > 1
          ? t("selectCheckoutMin", { count: minNights })
          : t("selectCheckout")
      : `${formatShortDate(range.from, locale)} – ${formatShortDate(range.to, locale)} · ${t("nightsCount", { count: nightsBetween(range.from, range.to) })}`;

  return (
    <div id={id} className="flex flex-col items-center">
      <p
        className="min-h-6 w-full px-1 pb-1 text-[14px] font-semibold text-ink"
        aria-live="polite"
      >
        {hint}
      </p>
      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        resetOnSelect
        disabled={disabled}
        startMonth={today}
        endMonth={lastBookableDate}
        defaultMonth={range?.from ?? today}
        locale={locale === "he" ? heLocale : enLocale}
        dir={locale === "he" ? "rtl" : "ltr"}
        modifiers={{ holiday: holidayDates, booked: bookedNights }}
        modifiersClassNames={{
          holiday: "rdp-holiday",
          booked: "rdp-booked",
        }}
        components={{
          DayButton: (props) => (
            <DefaultDayButton
              {...props}
              title={holidayNameByDate.get(toISODate(props.day.date))}
            />
          ),
        }}
      />
      <p className="w-full px-1 pt-1 text-xs text-ink-soft">
        {t.rich("bookedLegend", {
          s: (chunks) => <s>{chunks}</s>,
        })}
      </p>
    </div>
  );
}

/** Desktop card: check-in/out fields + guests, calendar expands inline. */
function DateFields({ idPrefix }: { idPrefix: string }) {
  const t = useTranslations("property");
  const locale = useLocale();
  const { range, setRange } = useBooking();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarId = `${idPrefix}-calendar`;

  const fieldClass =
    "flex min-h-14 flex-col items-start justify-center gap-0.5 px-3.5 py-2 text-start transition-colors duration-150 hover:bg-canvas";

  return (
    <div className="flex flex-col">
      <DroppedDatesNotice className="mb-2" />
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
        <div className="mt-2 flex flex-col rounded-[10px] border border-line p-2">
          <StayCalendar
            id={calendarId}
            onRangeComplete={() => setIsCalendarOpen(false)}
          />
          {range?.from && (
            <button
              type="button"
              onClick={() => setRange(undefined)}
              className="self-start px-1 py-2 text-[13px] font-semibold text-ink underline underline-offset-2"
            >
              {t("clearDates")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile: one compact summary row in the page; the calendar and guests live
 * in a bottom sheet, so a full month grid never sits in the reading flow.
 */
function MobileDatesPicker() {
  const t = useTranslations("property");
  const locale = useLocale();
  const { range, setRange, guests, nights, total } = useBooking();
  const {
    dialogRef,
    open,
    close,
    onDialogClose,
    onDialogClick,
    dragHandlers,
  } = useBottomSheet();
  const titleId = useId();

  const datesLabel = range?.from
    ? range.to
      ? `${formatShortDate(range.from, locale)} – ${formatShortDate(range.to, locale)}`
      : `${formatShortDate(range.from, locale)} – ${t("addDate")}`
    : t("addDates");

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="flex min-h-16 w-full items-center gap-3 rounded-[12px] border border-line px-3.5 py-3 text-start transition-colors duration-150 active:bg-canvas"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={`truncate text-[15px] font-semibold ${range?.from ? "text-ink" : "text-ink-soft"}`}
          >
            {datesLabel}
          </span>
          <span className="text-[14px] text-ink-soft">
            {nights > 0
              ? `${t("nightsCount", { count: nights })} · ${t("datesGuestsValue", { count: guests })}`
              : t("datesGuestsValue", { count: guests })}
          </span>
        </span>
        <span className="shrink-0 text-[14px] font-semibold text-ink underline underline-offset-4">
          {range?.from ? t("changeDates") : t("chooseDates")}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={onDialogClose}
        onClick={onDialogClick}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-ink translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop:bg-black/40 starting:translate-y-full motion-reduce:transition-opacity motion-reduce:starting:translate-y-0 motion-reduce:starting:opacity-0"
      >
        <div className="flex max-h-[92dvh] flex-col">
          {/* Grabber + title: drag down to dismiss. */}
          <div {...dragHandlers} className="flex shrink-0 cursor-grab flex-col gap-2 px-4 pt-3">
            <span className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-lg font-bold text-ink">
                {t("bookingTitle")}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label={t("contactClose")}
                className="-me-2 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-canvas"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">
            <StayCalendar id="booking-mobile-calendar" />
            <div className="mt-3 overflow-hidden rounded-[10px] border border-line">
              <GuestStepper />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              {nights > 0 ? (
                <>
                  <span className="text-base font-bold text-ink tabular-nums">
                    {formatPrice(total)}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {t("totalForNights", { nights })}
                  </span>
                </>
              ) : (
                range?.from && (
                  <button
                    type="button"
                    onClick={() => setRange(undefined)}
                    className="w-fit py-2 text-[14px] font-semibold text-ink underline underline-offset-2"
                  >
                    {t("clearDates")}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={close}
              className="flex min-h-12 items-center justify-center rounded-[10px] bg-brand px-8 text-base font-bold text-brand-foreground"
            >
              {t("saveDates")}
            </button>
          </div>
        </div>
      </dialog>
    </>
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
      <DroppedDatesNotice />
      <MobileDatesPicker />
    </section>
  );
}

/** Mobile: fixed bottom bar with the price (or stay total) and WhatsApp. */
export function MobileBookingBar() {
  const t = useTranslations("property");
  const { contact, nights, total, pricePerNight } = useBooking();

  return (
    <div className="material-bar fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line/70 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
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
