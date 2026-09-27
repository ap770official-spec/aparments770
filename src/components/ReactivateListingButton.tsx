"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateAvailabilityMode } from "@/app/[locale]/owner/actions";

export default function ReactivateListingButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    setSaving(true);
    try {
      await updateAvailabilityMode(propertyId, "default_open_block_dates");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-bold text-brand-foreground disabled:opacity-50"
    >
      {t("action.paused")}
    </button>
  );
}
