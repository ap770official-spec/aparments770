"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/**
 * Shown on the owner dashboard after an edit is submitted
 * (/owner/dashboard?edit=sent). Closing it drops the query param so a
 * refresh doesn't show it again.
 */
export default function EditSentDialog() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="edit-sent-title"
      onClose={() => router.replace("/owner/dashboard", { scroll: false })}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 text-ink shadow-xl transition-[opacity,scale] duration-200 ease-out backdrop:bg-black/40 starting:scale-95 starting:opacity-0 motion-reduce:transition-none"
    >
      <div className="flex flex-col items-center px-6 pt-7 pb-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF3E1] text-[#8A5A12]">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </div>
        <h2
          id="edit-sent-title"
          className="mt-4 font-serif-brand text-xl font-semibold"
        >
          {t("editSentTitle")}
        </h2>
        <p className="mt-2 text-[15px] leading-6 text-[#5C5349]">
          {t("editSentBody")}
        </p>
        <form method="dialog" className="mt-6 w-full">
          <button
            type="submit"
            autoFocus
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ink px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-black active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t("editSentClose")}
          </button>
        </form>
      </div>
    </dialog>
  );
}
