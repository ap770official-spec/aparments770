"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * The owner's free-text description. Keeps the line breaks the owner typed
 * (they're how owners structure "rooms / rules / notes"), and folds long
 * text behind "Read more" so the amenities and map stay within reach.
 */
export default function PropertyDescription({ text }: { text: string }) {
  const t = useTranslations("property");
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const textId = useId();

  // Only offer "Read more" when the clamp actually hides something; short
  // descriptions shouldn't get a button that does nothing.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => {
      if (!expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <div className="flex flex-col items-start gap-2">
      <p
        ref={textRef}
        id={textId}
        className={`whitespace-pre-line break-words text-[15px] leading-7 text-ink-soft ${
          expanded ? "" : "line-clamp-6"
        }`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={textId}
          className="flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-ink underline underline-offset-4"
        >
          {expanded ? t("readLess") : t("readMore")}
        </button>
      )}
    </div>
  );
}
