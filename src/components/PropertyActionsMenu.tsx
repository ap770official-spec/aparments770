"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { deleteProperty } from "@/app/[locale]/owner/actions";

export default function PropertyActionsMenu({
  propertyId,
  propertyPath,
  shareTitle,
}: {
  propertyId: string;
  propertyPath: string;
  shareTitle: string;
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isConfirmOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) setIsConfirmOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmOpen, deleting]);

  async function handleShare() {
    const url = new URL(propertyPath, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
      } catch {
        // user cancelled the native share sheet - nothing to do
      }
      setIsOpen(false);
      return;
    }

    await navigator.clipboard.writeText(url);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }

  function handleDeleteClick() {
    setIsOpen(false);
    setIsConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await deleteProperty(propertyId);
      router.refresh();
    } finally {
      setDeleting(false);
      setIsConfirmOpen(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("moreActions")}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint hover:bg-black/5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute top-9 z-10 flex w-40 flex-col gap-0.5 rounded-xl border border-border-soft bg-background p-1.5 shadow-lg end-0"
        >
          <button
            type="button"
            onClick={handleShare}
            role="menuitem"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm font-semibold hover:bg-black/5"
          >
            {justCopied ? t("shareCopied") : t("share")}
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            role="menuitem"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm font-semibold text-danger hover:bg-black/5"
          >
            {t("delete")}
          </button>
        </div>
      )}

      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setIsConfirmOpen(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            className="w-full max-w-sm rounded-2xl border border-border-soft bg-background p-5 shadow-lg"
          >
            <h2 id="delete-confirm-title" className="text-base font-bold">
              {t("delete")}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {t("deleteConfirm")}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-danger px-3 py-2 text-sm font-bold text-brand-foreground disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
