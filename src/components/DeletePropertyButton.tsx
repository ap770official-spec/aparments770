"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { deleteOwnerProperty } from "@/app/[locale]/owner/actions";

function TrashIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

/**
 * Trash button on an owner's listing card, with a confirmation dialog
 * before the listing is deleted for good. Points owners who only want
 * to hide it for a while to pausing it instead.
 */
export default function DeletePropertyButton({
  propertyId,
  address,
}: {
  propertyId: string;
  address: string;
}) {
  const t = useTranslations("dashboard.deleteProperty");
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, startDeleting] = useTransition();
  const [failed, setFailed] = useState(false);

  function confirmDelete() {
    setFailed(false);
    startDeleting(async () => {
      const result = await deleteOwnerProperty(propertyId);
      if (result.ok) {
        dialogRef.current?.close();
        router.refresh();
      } else {
        setFailed(true);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFailed(false);
          dialogRef.current?.showModal();
        }}
        aria-label={t("button")}
        title={t("button")}
        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-ink-muted transition-colors duration-150 hover:bg-[#FBEAEA] hover:text-[#9B2C2C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <TrashIcon size={18} />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-title-${propertyId}`}
        onCancel={(event) => {
          if (deleting) event.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 text-ink shadow-xl transition-[opacity,scale] duration-200 ease-out backdrop:bg-black/40 starting:scale-95 starting:opacity-0 motion-reduce:transition-none"
      >
        <div className="flex flex-col items-center px-6 pt-7 pb-6 text-center font-owner">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FBEAEA] text-[#9B2C2C]">
            <TrashIcon size={24} />
          </div>
          <h2
            id={`delete-title-${propertyId}`}
            className="mt-4 font-serif-brand text-xl font-semibold"
          >
            {t("title")}
          </h2>
          <p dir="auto" className="mt-1 text-[15px] font-semibold break-words text-ink">
            {address}
          </p>
          <p className="mt-2 text-[14px] leading-6 text-ink-soft">{t("body")}</p>
          <p className="mt-3 rounded-xl bg-cream px-3.5 py-2.5 text-[13px] leading-5 text-ink-soft">
            {t.rich("pauseHint", {
              link: (chunks) => (
                <Link
                  href={`/owner/properties/${propertyId}/availability`}
                  className="font-semibold text-brand underline underline-offset-2"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>

          {failed && (
            <p role="alert" className="mt-3 text-sm font-medium text-[#9B2C2C]">
              {t("error")}
            </p>
          )}

          <div className="mt-6 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              aria-busy={deleting}
              className="min-h-11 w-full cursor-pointer rounded-lg bg-[#9B2C2C] px-5 text-sm font-bold text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9B2C2C] disabled:cursor-wait disabled:opacity-60"
            >
              {deleting ? t("deleting") : t("confirm")}
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              disabled={deleting}
              className="min-h-11 w-full cursor-pointer rounded-lg px-5 text-sm font-semibold text-ink-soft transition-colors hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
