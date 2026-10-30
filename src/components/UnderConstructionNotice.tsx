"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "apartments770:under-construction-dismissed";

/**
 * Shown once per visitor (tracked via localStorage) until the site owner
 * removes this component - not meant to be a permanent fixture.
 */
export default function UnderConstructionNotice() {
  const t = useTranslations("underConstructionNotice");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShouldRender(true);
      }
    } catch {
      setShouldRender(true);
    }
  }, []);

  useEffect(() => {
    if (shouldRender) dialogRef.current?.showModal();
  }, [shouldRender]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage unavailable - the notice will simply reappear next visit
    }
  }

  if (!shouldRender) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="under-construction-title"
      onClose={dismiss}
      onMouseDown={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 text-ink shadow-xl backdrop:bg-black/40"
    >
      <div className="relative px-6 pt-7 pb-6">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label={t("close")}
          className="absolute end-3 top-3 rounded-full p-1 text-ink/60 hover:bg-black/5 hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
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

        <h2
          id="under-construction-title"
          className="font-serif-brand text-lg font-semibold"
        >
          {t("title")}
        </h2>
        <p className="mt-2 text-sm text-ink/80">{t("body")}</p>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="mt-4 w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          {t("close")}
        </button>
      </div>
    </dialog>
  );
}
