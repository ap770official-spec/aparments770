"use client";

import { useEffect, useRef, useState } from "react";
import { setListingExpiry } from "@/app/admin/actions";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";

type Tone = "neutral" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-line bg-white text-ink hover:border-ink-muted",
  warning: "border-amber-500/50 bg-amber-50 text-amber-900 hover:border-amber-600",
  danger: "border-red-600/40 bg-red-50 text-red-800 hover:border-red-600",
};

/**
 * "Listing shown until <date>" pill for an approved listing. Clicking
 * it swaps in a date input to change that one listing's expiry - the
 * label, tone and current date come from the server so this stays a
 * thin toggle around the setListingExpiry action.
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
  /** yyyy-mm-dd prefilled in the date input. */
  currentDate: string;
  fullWidth?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
    else if (wasEditing.current) triggerRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  if (!editing) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`${label} — לחץ לשינוי התאריך`}
        className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${TONE_CLASSES[tone]} ${fullWidth ? "w-full" : ""}`}
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
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await setListingExpiry(propertyId, formData);
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setEditing(false);
      }}
      className={`flex flex-wrap items-center gap-1.5 ${fullWidth ? "w-full" : ""}`}
    >
      <label className="sr-only" htmlFor={`listing-expiry-${propertyId}`}>
        מוצג באתר עד
      </label>
      <input
        ref={inputRef}
        id={`listing-expiry-${propertyId}`}
        type="date"
        name="expiresAt"
        defaultValue={currentDate}
        required
        className="min-h-10 min-w-0 flex-1 rounded-lg border border-line bg-white px-2 text-sm"
      />
      <PendingSubmitButton
        pendingLabel="שומר…"
        className="min-h-10 cursor-pointer rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        שמור
      </PendingSubmitButton>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="min-h-10 cursor-pointer rounded-lg px-3 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        ביטול
      </button>
    </form>
  );
}
