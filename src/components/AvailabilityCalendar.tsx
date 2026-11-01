"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { saveAvailability } from "@/app/[locale]/owner/actions";
import {
  addDays,
  isAvailableForNights,
  stayNights,
  type AvailabilityStatus,
} from "@/lib/availability";
import type { AvailabilityMode } from "@/lib/properties";

type DateMap = Record<string, AvailabilityStatus>;

const MODES: AvailabilityMode[] = [
  "default_open_block_dates",
  "default_closed_open_dates",
  "fully_locked",
];

const MODE_ICONS: Record<AvailabilityMode, ReactNode> = {
  default_open_block_dates: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </>
  ),
  default_closed_open_dates: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 18h.01" />
    </>
  ),
  fully_locked: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
};

function Icon({
  children,
  size = 20,
  className,
}: {
  children: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Days of a month as a grid: leading nulls pad to the week's first day. */
function monthGrid(monthKey: string): (string | null)[] {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array(first.getUTCDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${monthKey}-${String(d).padStart(2, "0")}`);
  }
  return cells;
}

export default function AvailabilityCalendar({
  propertyId,
  address,
  initialMode,
  initialDates,
  today,
  months,
  hebrewDays,
  holidays,
  locale,
}: {
  propertyId: string;
  address: string;
  initialMode: AvailabilityMode;
  initialDates: DateMap;
  today: string;
  months: { key: string; hebrewLabel: string }[];
  hebrewDays: Record<string, string>;
  holidays: Record<string, string>;
  locale: string;
}) {
  const t = useTranslations("availability");

  // What's saved on the server vs. what's on screen; the difference is
  // what the save bar offers to save or discard.
  const [saved, setSaved] = useState({ mode: initialMode, dates: initialDates });
  const [mode, setMode] = useState(initialMode);
  const [dates, setDates] = useState<DateMap>(initialDates);

  const [monthIndex, setMonthIndex] = useState(0);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const [saving, startSaving] = useTransition();
  const [notice, setNotice] = useState<"saved" | "error" | null>(null);

  const changes = useMemo(() => {
    const keys = new Set([...Object.keys(saved.dates), ...Object.keys(dates)]);
    return [...keys]
      .filter((key) => saved.dates[key] !== dates[key])
      .map((date) => ({ date, status: dates[date] ?? null }));
  }, [saved.dates, dates]);
  const changedDates = useMemo(
    () => new Set(changes.map((c) => c.date)),
    [changes],
  );
  const dirty = mode !== saved.mode || changes.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (notice !== "saved") return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const clearSelection = useCallback(() => {
    setAnchor(null);
    setRangeEnd(null);
    setHovered(null);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSelection]);

  const selection = useMemo(() => {
    if (!anchor) return null;
    const other = rangeEnd ?? anchor;
    const [from, to] = anchor <= other ? [anchor, other] : [other, anchor];
    return { from, to, nights: stayNights(from, addDays(to, 1)) };
  }, [anchor, rangeEnd]);

  const preview = useMemo(() => {
    if (!anchor || rangeEnd || !hovered || hovered < today) return null;
    const [from, to] = anchor <= hovered ? [anchor, hovered] : [hovered, anchor];
    return { from, to };
  }, [anchor, rangeEnd, hovered, today]);

  const dateMap = useMemo(() => new Map(Object.entries(dates)), [dates]);
  const isAvailable = (date: string) =>
    isAvailableForNights(mode, dateMap, [date]);

  function handleDayClick(date: string) {
    setNotice(null);
    if (!anchor || rangeEnd) {
      setAnchor(date);
      setRangeEnd(null);
    } else if (date === anchor) {
      clearSelection();
    } else {
      setRangeEnd(date);
    }
  }

  function applyToSelection(available: boolean) {
    if (!selection) return;
    setDates((prev) => {
      const next = { ...prev };
      for (const night of selection.nights) {
        // Store only what the current mode needs; clearing a date falls
        // back to the mode's default (open, or closed).
        const status: AvailabilityStatus | null =
          mode === "default_open_block_dates"
            ? available
              ? null
              : "blocked"
            : available
              ? "open"
              : null;
        if (status) next[night] = status;
        else delete next[night];
      }
      return next;
    });
    clearSelection();
  }

  function discard() {
    setMode(saved.mode);
    setDates(saved.dates);
    clearSelection();
    setNotice(null);
  }

  function save() {
    clearSelection();
    startSaving(async () => {
      const result = await saveAvailability(propertyId, mode, changes);
      if (result.ok) {
        setSaved({ mode, dates });
        setNotice("saved");
      } else {
        setNotice("error");
      }
    });
  }

  const fmtMonth = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const fmtDay = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const fmtFull = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(
      new Date(Date.UTC(2026, 10, 1 + i)),
    ),
  );

  const visibleMonths = months.slice(monthIndex, monthIndex + 2);
  const selectionLabel = selection
    ? selection.from === selection.to
      ? fmtDay.format(asDate(selection.from))
      : `${fmtDay.format(asDate(selection.from))} – ${fmtDay.format(asDate(selection.to))}`
    : "";

  return (
    <div className="min-h-full bg-cream font-owner">
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-40 sm:pt-12">
        <Link
          href="/owner/dashboard"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          <Icon size={16} className="rtl:rotate-180">
            <path d="m15 18-6-6 6-6" />
          </Icon>
          {t("back")}
        </Link>

        <header className="mt-2">
          <h1 className="font-serif-brand text-[34px] leading-tight font-normal text-ink sm:text-[42px]">
            {t("title")}
          </h1>
          <p dir="auto" className="mt-1 text-start text-[15px] text-ink-muted">
            {address}
          </p>
        </header>

        <fieldset className="mt-7">
          <legend className="mb-3 text-sm font-bold text-ink">
            {t("modeQuestion")}
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((option) => {
              const active = mode === option;
              return (
                <label
                  key={option}
                  className={`relative flex cursor-pointer gap-3 rounded-2xl border-2 bg-white p-4 transition-[border-color,box-shadow] duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand sm:flex-col sm:gap-2 sm:p-5 ${
                    active
                      ? "border-brand shadow-[0_10px_24px_-16px_rgba(110,78,55,0.6)]"
                      : "border-transparent shadow-[0_6px_18px_-14px_rgba(110,78,55,0.45)] hover:border-[#E6DCCB]"
                  }`}
                >
                  <input
                    type="radio"
                    name="availability-mode"
                    value={option}
                    checked={active}
                    onChange={() => {
                      setMode(option);
                      clearSelection();
                      setNotice(null);
                    }}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      active ? "bg-brand text-brand-foreground" : "bg-cream text-gold"
                    }`}
                  >
                    <Icon>{MODE_ICONS[option]}</Icon>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-ink">
                      {t(`modes.${option}.title`)}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-5 text-ink-muted">
                      {t(`modes.${option}.description`)}
                    </span>
                  </span>
                  {active && (
                    <span className="absolute end-3 top-3 text-brand">
                      <Icon size={18}>
                        <path d="M20 6 9 17l-5-5" />
                      </Icon>
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        {mode === "fully_locked" ? (
          <div className="mt-6 flex flex-col items-center rounded-[22px] bg-white px-6 py-12 text-center shadow-[0_12px_32px_-20px_rgba(110,78,55,0.45)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-gold">
              <Icon size={26}>{MODE_ICONS.fully_locked}</Icon>
            </span>
            <h2 className="mt-4 font-serif-brand text-2xl text-ink">
              {t("pausedTitle")}
            </h2>
            <p className="mt-2 max-w-sm text-[15px] leading-6 text-ink-soft">
              {t("pausedBody")}
            </p>
          </div>
        ) : (
          <section
            aria-labelledby="calendar-heading"
            className="mt-6 rounded-[22px] bg-white p-4 shadow-[0_12px_32px_-20px_rgba(110,78,55,0.45)] sm:p-6"
          >
            <h2 id="calendar-heading" className="sr-only">
              {t("calendarHeading")}
            </h2>
            <p className="text-sm text-ink-soft">
              {mode === "default_open_block_dates"
                ? t("hintOpen")
                : t("hintClosed")}
            </p>

            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-muted">
              <li className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md bg-white ring-1 ring-[#E6DCCB]" />
                {t("legendAvailable")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md bg-[repeating-linear-gradient(135deg,#EDE6DC_0_3px,#F7F3EE_3px_6px)] ring-1 ring-[#E6DCCB]" />
                {t("legendUnavailable")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {t("legendHoliday")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md ring-2 ring-gold-soft" />
                {t("legendUnsaved")}
              </li>
            </ul>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
                disabled={monthIndex === 0}
                aria-label={t("prevMonth")}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-cream disabled:cursor-default disabled:opacity-30"
              >
                <Icon size={20} className="rtl:rotate-180">
                  <path d="m15 18-6-6 6-6" />
                </Icon>
              </button>
              <p aria-live="polite" className="sr-only">
                {fmtMonth.format(asDate(`${visibleMonths[0].key}-01`))}
              </p>
              <button
                type="button"
                onClick={() =>
                  setMonthIndex((i) => Math.min(months.length - 1, i + 1))
                }
                disabled={monthIndex >= months.length - 1}
                aria-label={t("nextMonth")}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-cream disabled:cursor-default disabled:opacity-30"
              >
                <Icon size={20} className="rtl:rotate-180">
                  <path d="m9 18 6-6-6-6" />
                </Icon>
              </button>
            </div>

            <div
              className="mt-2 grid gap-8 md:grid-cols-2"
              onMouseLeave={() => setHovered(null)}
            >
              {visibleMonths.map((month, i) => (
                <div key={month.key} className={i === 1 ? "hidden md:block" : ""}>
                  <div className="mb-3 text-center">
                    <h3 className="font-serif-brand text-xl text-ink">
                      {fmtMonth.format(asDate(`${month.key}-01`))}
                    </h3>
                    <p className="text-xs text-gold">{month.hebrewLabel}</p>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {weekdays.map((day, d) => (
                      <span
                        key={d}
                        aria-hidden="true"
                        className="pb-1 text-xs font-semibold text-ink-muted"
                      >
                        {day}
                      </span>
                    ))}
                    {monthGrid(month.key).map((date, cell) => {
                      if (!date) return <span key={`pad-${cell}`} />;
                      const past = date < today;
                      const available = isAvailable(date);
                      const holiday = holidays[date];
                      const selected =
                        selection && date >= selection.from && date <= selection.to;
                      const previewed =
                        preview && date >= preview.from && date <= preview.to;
                      const changed = changedDates.has(date);
                      return (
                        <button
                          key={date}
                          type="button"
                          disabled={past}
                          onClick={() => handleDayClick(date)}
                          onMouseEnter={() => setHovered(date)}
                          aria-pressed={Boolean(selected)}
                          aria-label={[
                            fmtFull.format(asDate(date)),
                            available ? t("legendAvailable") : t("legendUnavailable"),
                            holiday,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                          title={holiday}
                          className={`relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-[15px] leading-none transition-[background-color,box-shadow,color] duration-150 select-none ${
                            past
                              ? "cursor-default text-[#CFC6BA]"
                              : "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
                          } ${
                            selected
                              ? "bg-brand font-bold text-brand-foreground"
                              : previewed
                                ? "bg-[#EADFCC] text-ink"
                                : past
                                  ? ""
                                  : available
                                    ? "bg-white font-semibold text-ink hover:bg-cream"
                                    : "bg-[repeating-linear-gradient(135deg,#EDE6DC_0_3px,#F7F3EE_3px_6px)] text-ink-muted"
                          } ${changed && !selected ? "ring-2 ring-gold-soft ring-inset" : ""}`}
                        >
                          <span
                            className={
                              !past && !selected && !previewed && !available
                                ? "line-through decoration-[#B9AE9F]"
                                : date === today && !selected
                                  ? "underline decoration-gold decoration-2 underline-offset-4"
                                  : undefined
                            }
                          >
                            {Number(date.slice(8))}
                          </span>
                          <span
                            className={`mt-1 text-[10px] font-normal ${
                              selected ? "text-white/80" : "text-ink-muted"
                            }`}
                          >
                            {hebrewDays[date]}
                          </span>
                          {holiday && (
                            <span
                              aria-hidden="true"
                              className={`absolute top-1.5 end-1.5 h-1.5 w-1.5 rounded-full ${
                                selected ? "bg-white" : "bg-gold"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {selection && mode !== "fully_locked" && (
            <div
              role="region"
              aria-label={t("selectionRegion")}
              className="pointer-events-auto flex flex-col gap-3 rounded-2xl bg-ink p-4 text-white shadow-2xl motion-safe:animate-[sheet-in_200ms_cubic-bezier(0.23,1,0.32,1)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-[15px] font-bold">
                  {selectionLabel}
                  <span className="font-normal text-white/70">
                    {" · "}
                    {t("nights", { count: selection.nights.length })}
                  </span>
                </p>
                {!rangeEnd && (
                  <p className="mt-0.5 text-[13px] text-white/60">{t("rangeHint")}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyToSelection(false)}
                  className={`min-h-11 flex-1 cursor-pointer rounded-xl px-4 text-sm font-bold transition-[opacity,transform] duration-150 active:scale-[0.97] sm:flex-none ${
                    mode === "default_open_block_dates"
                      ? "bg-white text-ink"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {t("markUnavailable")}
                </button>
                <button
                  type="button"
                  onClick={() => applyToSelection(true)}
                  className={`min-h-11 flex-1 cursor-pointer rounded-xl px-4 text-sm font-bold transition-[opacity,transform] duration-150 active:scale-[0.97] sm:flex-none ${
                    mode === "default_closed_open_dates"
                      ? "bg-white text-ink"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {t("markAvailable")}
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  aria-label={t("cancelSelection")}
                  className="flex min-h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Icon size={18}>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </Icon>
                </button>
              </div>
            </div>
          )}

          {(dirty || notice) && (
            <div
              className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl bg-white p-3 ps-4 shadow-[0_12px_40px_-12px_rgba(26,21,18,0.35)] ring-1 ring-[#E6DCCB] motion-safe:animate-[sheet-in_200ms_cubic-bezier(0.23,1,0.32,1)]"
            >
              <p role="status" className="text-sm font-semibold text-ink">
                {notice === "saved" && !dirty
                  ? t("saved")
                  : notice === "error"
                    ? <span className="text-[#9B2C2C]">{t("saveError")}</span>
                    : t("unsaved", {
                        count: changes.length + (mode !== saved.mode ? 1 : 0),
                      })}
              </p>
              {dirty && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={discard}
                    disabled={saving}
                    className="min-h-11 cursor-pointer rounded-xl px-3 text-sm font-semibold text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
                  >
                    {t("discard")}
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    aria-busy={saving}
                    className="min-h-11 cursor-pointer rounded-xl bg-brand px-5 text-sm font-bold text-brand-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
                  >
                    {saving ? t("saving") : t("save")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
