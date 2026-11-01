"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PropertyPhoto } from "@/lib/properties";
import { CardMedia } from "@/components/CardMedia";
import { useActiveSlide } from "@/lib/useActiveSlide";

/** Enough to get a feel for the place without loading the whole gallery. */
const MAX_CARD_PHOTOS = 5;

/**
 * Swipeable photos on a result card. Native scroll-snap does the swiping
 * (and a tap after no movement is still a click), every photo links to the
 * listing, and only the first photo loads up front.
 */
export default function CardPhotoCarousel({
  photos,
  href,
  label,
}: {
  photos: PropertyPhoto[];
  href: string;
  /** The listing's name, for the photo links' accessible names. */
  label: string;
}) {
  const t = useTranslations("property");
  const trackRef = useRef<HTMLDivElement>(null);
  const slides = [...photos]
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, MAX_CARD_PHOTOS);
  const active = useActiveSlide(trackRef, slides.length);

  function go(step: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    // scrollBy is physical: in RTL "next" (toward the end) is leftwards.
    const isRtl = getComputedStyle(track).direction === "rtl";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: track.clientWidth * step * (isRtl ? -1 : 1),
      behavior: reduce ? "auto" : "smooth",
    });
  }

  if (slides.length <= 1) {
    return (
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
        <CardMedia media={slides[0]} className="h-full w-full" eager />
      </Link>
    );
  }

  const arrowClass =
    "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow transition-opacity duration-150 group-hover/photos:opacity-100 disabled:opacity-0! pointer-fine:flex";

  return (
    <div className="group/photos relative h-full w-full">
      <div
        ref={trackRef}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((photo, index) => (
          <Link
            key={photo.url}
            href={href}
            data-slide-index={index}
            // One tab stop per card is the title link; the photos are for
            // pointer and touch browsing.
            tabIndex={-1}
            aria-label={t("photoAlt", { title: label, index: index + 1, total: slides.length })}
            className="block h-full w-full shrink-0 snap-center snap-always [-webkit-tap-highlight-color:transparent]"
            draggable={false}
          >
            <CardMedia media={photo} className="h-full w-full" eager={index === 0} />
          </Link>
        ))}
      </div>

      {/* Desktop: arrows on hover (touch users swipe). */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => go(-1)}
        disabled={active === 0}
        className={`${arrowClass} start-2`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="rtl:-scale-x-100">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => go(1)}
        disabled={active === slides.length - 1}
        className={`${arrowClass} end-2`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="rtl:-scale-x-100">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 end-3 flex gap-1.5 rounded-full bg-black/35 px-2 py-1.5"
      >
        {slides.map((photo, index) => (
          <span
            key={photo.url}
            className={`block h-1.5 w-1.5 rounded-full transition-colors duration-150 ${
              index === active ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
