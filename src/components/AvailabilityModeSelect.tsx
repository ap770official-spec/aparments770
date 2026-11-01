"use client";

import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateAvailabilityMode } from "@/app/[locale]/owner/actions";
import type { AvailabilityMode } from "@/lib/properties";

const MODES: AvailabilityMode[] = [
  "default_open_block_dates",
  "default_closed_open_dates",
  "fully_locked",
];

export default function AvailabilityModeSelect({
  propertyId,
  initialMode,
  hideLabel = false,
  selectClassName = "border border-[#D8CFC0] bg-white hover:border-[#A89E90]",
}: {
  propertyId: string;
  initialMode: AvailabilityMode;
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
  /** Border/background classes for the select itself. */
  selectClassName?: string;
}) {
  const t = useTranslations("dashboard.availabilityMode");
  const router = useRouter();
  const [mode, setMode] = useState<AvailabilityMode>(initialMode);
  const [saving, setSaving] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as AvailabilityMode;
    setMode(next);
    setSaving(true);
    try {
      await updateAvailabilityMode(propertyId, next);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#5C5349]">
      <span className={hideLabel ? "sr-only" : undefined}>{t("label")}</span>
      <span className="relative">
        <select
          value={mode}
          onChange={handleChange}
          disabled={saving}
          aria-busy={saving}
          className={`min-h-11 w-full appearance-none rounded-xl ps-3.5 pe-9 text-sm font-medium text-ink transition-colors duration-150 ${selectClassName} focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand/40 disabled:cursor-wait disabled:opacity-60`}
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {t(m)}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-[#8A8073]">
          {saving ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.2-8.56" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </span>
      </span>
    </label>
  );
}
