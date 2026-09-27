"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function ShareMenu({
  shareText,
  buttonClassName,
  buttonSize = 18,
}: {
  shareText: string;
  buttonClassName: string;
  buttonSize?: number;
}) {
  const t = useTranslations("property");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pageUrl] = useState(() =>
    typeof window !== "undefined" ? window.location.href : "",
  );
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied - nothing sensible to do beyond leaving the
      // link unchanged for the visitor to copy from the address bar
    }
    setIsOpen(false);
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(pageUrl)}`;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("shareButtonLabel")}
        title={t("shareButtonLabel")}
        className={buttonClassName}
      >
        <svg
          viewBox="0 0 24 24"
          width={buttonSize}
          height={buttonSize}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute end-0 top-full z-10 mt-2 w-52 flex-col rounded-xl border border-[#E5DED3] bg-white p-2 text-sm shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-[13.5px] font-semibold text-ink hover:bg-black/5"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 12a3 3 0 0 0 4.24 0l3-3a3 3 0 0 0-4.24-4.24l-1 1" />
              <path d="M15 12a3 3 0 0 0-4.24 0l-3 3a3 3 0 0 0 4.24 4.24l1-1" />
            </svg>
            {copied ? t("shareLinkCopied") : t("shareCopyLink")}
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-[13.5px] font-semibold text-ink hover:bg-black/5"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-accent-whatsapp"
              aria-hidden="true"
            >
              <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.3 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" />
            </svg>
            {t("shareWhatsApp")}
          </a>
          <a
            href={emailHref}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-[13.5px] font-semibold text-ink hover:bg-black/5"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
            {t("shareEmail")}
          </a>
        </div>
      )}
    </div>
  );
}
