"use client";

import { useCallback, useId, useRef, useState } from "react";
import { setListingExpiry } from "@/app/admin/actions";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";
import {
  CalendarPopover,
  ExpiryCalendar,
  parseLocalDate,
  toLocalDateValue,
  useDismiss,
} from "@/components/admin/AdminDatePicker";

type Tone = "neutral" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-line bg-white text-ink hover:border-ink-muted",
  warning: "border-amber-500/50 bg-amber-50 text-amber-900 hover:border-amber-600",
  danger: "border-red-600/40 bg-red-50 text-red-800 hover:border-red-600",
};

/**
 * "Listing shown until <date>" pill for an approved listing. Clicking
 * it opens the admin calendar to change that one listing's expiry - the
 * label, tone and current date come from the server so this stays a
 * thin wrapper around the setListingExpiry action.
 */
export default function ListingExpiryEditor({
  propertyId,
  label,
  tone,
  currentDate,
  fullWidth = false,
}: {
  propertyId: string;
  label: string;
  tone: Tone;
  /** yyyy-mm-dd the calendar opens on. */
  currentDate: string;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Date | undefined>(() => parseLocalDate(currentDate));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef, triggerRef);

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          // Reopening starts from the saved date, not a discarded pick.
          if (!open) setValue(parseLocalDate(currentDate));
          setOpen((o) => !o);
        }}
        aria-label={`${label} — לחץ לשינוי התאריך`}
        className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${TONE_CLASSES[tone]} ${fullWidth ? "w-full" : ""}`}
      >
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 opacity-60"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
        </svg>
      </button>

      <CalendarPopover open={open} onClose={close} labelledBy={headingId}>
        <p id={headingId} className="mb-3 text-sm font-bold text-ink">
          עד מתי הדירה מוצגת באתר?
        </p>
        <form
          action={async (formData) => {
            await setListingExpiry(propertyId, formData);
            close();
            triggerRef.current?.focus();
          }}
        >
          <input type="hidden" name="expiresAt" value={value ? toLocalDateValue(value) : ""} />
          <ExpiryCalendar value={value} onChange={setValue} />
          <div className="mt-3 flex gap-2">
            <PendingSubmitButton
              pendingLabel="שומר…"
              className="min-h-11 flex-1 cursor-pointer rounded-lg bg-brand text-sm font-semibold text-brand-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
            >
              שמור תאריך
            </PendingSubmitButton>
            <button
              type="button"
              onClick={() => {
                close();
                triggerRef.current?.focus();
              }}
              className="min-h-11 cursor-pointer rounded-lg border border-line px-4 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              ביטול
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">משנה את התאריך לדירה הזו בלבד.</p>
        </form>
      </CalendarPopover>
    </div>
  );
}
