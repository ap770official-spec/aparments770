"use client";

import { useId, useState } from "react";
import { useBottomSheet } from "@/lib/useBottomSheet";
import { useTranslations } from "next-intl";

export type ContactDetails = {
  whatsappLink: string;
  telLink: string;
  phoneDisplay: string;
  /** Whether the WhatsApp message already carries dates and guests. */
  hasStayDetails: boolean;
};

function WhatsAppIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.3 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" />
    </svg>
  );
}

function PhoneIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function ContactChoices({ details }: { details: ContactDetails }) {
  const t = useTranslations("property");
  const [copied, setCopied] = useState(false);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(details.phoneDisplay);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked - the number is on screen to copy by hand.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <a
        href={details.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="press flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-accent-whatsapp px-4 py-3 text-base font-bold text-white transition-[filter] duration-150 hover:brightness-110"
      >
        <WhatsAppIcon size={18} />
        {t("contactWhatsApp")}
      </a>
      <p className="text-center text-[13px] leading-relaxed text-ink-soft">
        {details.hasStayDetails
          ? t("contactWhatsAppHintDates")
          : t("contactWhatsAppHint")}
      </p>

      <div className="flex items-center gap-3 py-1" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-semibold text-ink-soft">{t("contactOr")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex flex-col gap-3 rounded-[10px] border border-line p-3.5">
        <span className="text-[13px] font-semibold text-ink-soft">
          {t("contactPhoneLabel")}
        </span>
        <span
          dir="ltr"
          className="text-center text-xl font-bold tracking-wide text-ink tabular-nums select-all"
        >
          {details.phoneDisplay}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={details.telLink}
            className="press flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-ink px-3 text-[15px] font-bold text-white transition-[filter] duration-150 hover:brightness-125"
          >
            <PhoneIcon size={16} />
            {t("contactCall")}
          </a>
          <button
            type="button"
            onClick={copyPhone}
            aria-label={copied ? t("phoneCopied") : t("copyPhoneLabel")}
            className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-ink px-3 text-[15px] font-semibold text-ink transition-colors duration-150 hover:bg-canvas"
          >
            <span aria-live="polite">
              {copied ? t("phoneCopied") : t("copyPhone")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

const CTA_CLASS =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-brand px-4 py-3 text-base font-bold text-brand-foreground transition-[filter] duration-150 hover:brightness-110";

/** Desktop: the button expands the two options in place, inside the card. */
export function ContactInline({ details }: { details: ContactDetails }) {
  const t = useTranslations("property");
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className={CTA_CLASS}
      >
        {t("contactCta")}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          id={panelId}
          className="opacity-100 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] starting:opacity-0"
        >
          <ContactChoices details={details} />
        </div>
      )}
    </div>
  );
}

/** Mobile: the bottom-bar button opens the two options in a bottom sheet. */
export function ContactSheetButton({
  details,
  className,
}: {
  details: ContactDetails;
  className?: string;
}) {
  const t = useTranslations("property");
  const {
    dialogRef,
    open,
    close,
    onDialogClose,
    onDialogClick,
    dragHandlers,
  } = useBottomSheet();
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className={className ?? CTA_CLASS}
      >
        {t("contactCta")}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={onDialogClose}
        onClick={onDialogClick}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-ink translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop:bg-black/40 starting:translate-y-full motion-reduce:transition-opacity motion-reduce:starting:translate-y-0 motion-reduce:starting:opacity-0"
      >
        <div className="flex flex-col gap-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* Grabber + title: drag down to dismiss. */}
          <div {...dragHandlers} className="-mx-4 -mt-3 flex cursor-grab flex-col gap-4 px-4 pt-3">
          <span className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-lg font-bold text-ink">
              {t("contactTitle")}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={t("contactClose")}
              className="-me-2 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-canvas"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          </div>
          <ContactChoices details={details} />
        </div>
      </dialog>
    </>
  );
}
