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
}: {
  propertyId: string;
  initialMode: AvailabilityMode;
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
    <label className="mt-1 flex flex-col gap-0.5 text-xs">
      {t("label")}
      <select
        value={mode}
        onChange={handleChange}
        disabled={saving}
        className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-xs dark:border-white/20"
      >
        {MODES.map((m) => (
          <option key={m} value={m}>
            {t(m)}
          </option>
        ))}
      </select>
    </label>
  );
}
