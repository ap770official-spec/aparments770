"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { DayPicker } from "react-day-picker";
import { he as heLocale } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { formatShortDate } from "@/lib/displayDate";

/**
 * Calendar for the admin's listing-expiry dates, replacing the
 * browser's native <input type="date"> (US-ordered, unstyled, different
 * on every device). Quick presets cover the usual "a year from today",
 * the summary spells the date out in full + its Hebrew date, and a date
 * in the past warns that it takes the listing off the site at once.
 *
 * Dates travel as local yyyy-mm-dd strings - the same shape the
 * server actions already parse - so no timezone shifts creep in.
 */

const PRESETS = [
  { months: 1, label: "חודש" },
  { months: 3, label: "3 חודשים" },
  { months: 6, label: "חצי שנה" },
  { months: 12, label: "שנה" },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseLocalDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toLocalDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** "יום ב׳, 25 באוקטובר 2027" */
export function formatLongHebrewDate(date: Date): string {
  return date.toLocaleDateString("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function relativeDays(date: Date): { text: string; past: boolean } {
  const days = Math.round((date.getTime() - startOfToday().getTime()) / DAY_MS);
  if (days === 0) return { text: "היום", past: false };
  if (days === 1) return { text: "מחר", past: false };
  if (days > 0) return { text: `בעוד ${days} ימים`, past: false };
  return { text: days === -1 ? "אתמול" : `לפני ${-days} ימים`, past: true };
}

/** Presets + month calendar + spelled-out summary of the selection. */
function ExpiryCalendar({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (date: Date) => void;
}) {
  const today = startOfToday();
  const [month, setMonth] = useState<Date>(value ?? today);
  const relative = value ? relativeDays(value) : null;

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="בחירה מהירה" className="grid grid-cols-4 gap-1.5">
        {PRESETS.map((preset) => {
          const date = addMonths(today, preset.months);
          const active = value && toLocalDateValue(value) === toLocalDateValue(date);
          return (
            <button
              key={preset.months}
              type="button"
              aria-pressed={!!active}
              onClick={() => {
                onChange(date);
                setMonth(date);
              }}
              className={`min-h-10 cursor-pointer rounded-lg border px-1 text-[13px] font-semibold transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-line bg-white text-ink hover:border-ink-muted"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <p className="-mt-1 text-[11px] text-ink-muted">הבחירה המהירה נספרת מהיום.</p>

      <DayPicker
        mode="single"
        required
        selected={value}
        onSelect={(date) => date && onChange(date)}
        month={month}
        onMonthChange={setMonth}
        captionLayout="dropdown"
        startMonth={addMonths(today, -24)}
        endMonth={addMonths(today, 60)}
        locale={heLocale}
        dir="rtl"
        autoFocus
        className="admin-calendar"
      />

      <div
        aria-live="polite"
        className={`rounded-xl px-3 py-2.5 text-sm ${
          relative?.past ? "bg-red-50 text-red-800" : "bg-canvas text-ink"
        }`}
      >
        {value ? (
          <>
            <p className="font-semibold">{formatLongHebrewDate(value)}</p>
            <p className={relative?.past ? "text-red-700" : "text-ink-soft"}>
              {formatShortDate(value, "he")} · {relative?.text}
              {relative?.past && " — הדירה תרד מהאתר מיד"}
            </p>
          </>
        ) : (
          <p className="text-ink-muted">לא נבחר תאריך</p>
        )}
      </div>
    </div>
  );
}

/** Close on Escape or a press outside, returning focus to the trigger. */
function useDismiss(
  open: boolean,
  close: () => void,
  rootRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close, rootRef, triggerRef]);
}

/**
 * Anchored popover on wider screens, bottom sheet (with a dimmed
 * backdrop) on phones, where an anchored panel would run off-screen.
 */
function CalendarPopover({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="admin-sheet-backdrop fixed inset-0 z-30 bg-ink/30 sm:hidden"
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby={labelledBy}
        className="admin-popover fixed inset-x-0 bottom-0 z-40 max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-line bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(26,21,18,0.14)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:end-0 sm:top-full sm:mt-2 sm:w-[22rem] sm:rounded-2xl sm:pb-4 sm:shadow-[0_12px_40px_rgba(26,21,18,0.16)]"
      >
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        {children}
      </div>
    </>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 opacity-70"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

/**
 * Form field: a button showing the chosen date that opens the calendar,
 * plus a hidden input carrying yyyy-mm-dd under `name`.
 */
export default function AdminDateField({
  name,
  defaultValue,
  label,
  fullWidth = false,
}: {
  name: string;
  /** yyyy-mm-dd */
  defaultValue: string;
  /** Heading inside the calendar, and the trigger's accessible name. */
  label: string;
  fullWidth?: boolean;
}) {
  const [value, setValue] = useState<Date | undefined>(() => parseLocalDate(defaultValue));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef, triggerRef);

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <input type="hidden" name={name} value={value ? toLocalDateValue(value) : ""} />
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${value ? formatLongHebrewDate(value) : "לא נבחר"}`}
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 text-sm font-semibold text-ink transition-[border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          open ? "border-brand shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_15%,transparent)]" : "border-line hover:border-ink-muted"
        } ${fullWidth ? "w-full" : ""}`}
      >
        <CalendarIcon />
        <span className="tabular-nums">
          {value ? value.toLocaleDateString("en-GB") : "בחר תאריך"}
        </span>
      </button>

      <CalendarPopover open={open} onClose={close} labelledBy={headingId}>
        <p id={headingId} className="mb-3 text-sm font-bold text-ink">
          {label}
        </p>
        <ExpiryCalendar value={value} onChange={setValue} />
        <button
          type="button"
          onClick={() => {
            close();
            triggerRef.current?.focus();
          }}
          className="mt-3 min-h-11 w-full cursor-pointer rounded-lg bg-ink text-sm font-semibold text-white transition-transform duration-150 active:scale-[0.97]"
        >
          אישור התאריך
        </button>
      </CalendarPopover>
    </div>
  );
}

export { ExpiryCalendar, CalendarPopover, useDismiss, CalendarIcon };
