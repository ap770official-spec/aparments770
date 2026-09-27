"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export default function BackToSearchLink() {
  const t = useTranslations("property");
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5C5349]"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {t("backToSearch")}
    </button>
  );
}
