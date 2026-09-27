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

  async function handleDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    try {
      await deleteProperty(propertyId);
      router.refresh();
    } finally {
      setDeleting(false);
      setIsOpen(false);
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
            onClick={handleDelete}
            disabled={deleting}
            role="menuitem"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm font-semibold text-danger hover:bg-black/5 disabled:opacity-50"
          >
            {t("delete")}
          </button>
        </div>
      )}
    </div>
  );
}
