"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SitePreviewBanner() {
  const t = useTranslations("sitePreviewBanner");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-center gap-3 border-b border-line bg-gold-soft/20 px-4 py-2 text-center text-[13px] font-medium text-ink">
      <p className="flex-1">{t("text")}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("close")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/60 hover:bg-black/5 hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          width={16}
          height={16}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
