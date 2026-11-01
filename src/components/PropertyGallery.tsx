"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import type { PropertyPhoto } from "@/lib/properties";
import FavoriteButton from "@/components/FavoriteButton";
import ShareMenu from "@/components/ShareMenu";

const OVERLAY_BUTTON_CLASS =
  "flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_1px_4px_rgba(26,21,18,0.18)]";

const SCROLLER_CLASS =
  "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const DESKTOP_THUMB_COUNT = 4;

/**
 * Index of the slide currently filling a horizontal scroll-snap track.
 * Slides mark themselves with data-slide-index. IntersectionObserver keeps
 * this direction-agnostic (RTL scrollLeft is negative in most browsers).
 */
function useActiveSlide(
  trackRef: RefObject<HTMLDivElement | null>,
  slideCount: number,
): number {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.slideIndex));
          }
        }
      },
      { root: track, threshold: 0.6 },
    );
    track
      .querySelectorAll("[data-slide-index]")
      .forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [trackRef, slideCount]);

  return active;
}

function scrollToSlide(
  track: HTMLDivElement | null,
  index: number,
  behavior: ScrollBehavior,
) {
  const slide = track?.querySelector<HTMLElement>(
    `[data-slide-index="${index}"]`,
  );
  slide?.scrollIntoView({ behavior, block: "nearest", inline: "center" });
}

/** A modal dialog doesn't stop the page behind it from scrolling. */
function setPageScrollLocked(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Media({
  photo,
  alt,
  className,
  eager = false,
  fit = "cover",
}: {
  photo: PropertyPhoto | undefined;
  alt: string;
  className: string;
  eager?: boolean;
  fit?: "cover" | "contain";
}) {
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  if (!photo) return <div className={`${className} bg-placeholder`} />;
  return photo.media_type === "video" ? (
    <video
      src={optimizedCloudinaryUrl(photo.url)}
      className={`${className} ${fitClass} bg-black`}
      aria-label={alt}
      preload="metadata"
      playsInline
      muted
      controls
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizedCloudinaryUrl(photo.url)}
      alt={alt}
      className={`${className} ${fitClass}`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
    />
  );
}

/** Chevron pointing toward the reading direction's start ("previous"). */
function ChevronStart({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="rtl:-scale-x-100"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function Lightbox({
  photos,
  photoAlt,
  dialogRef,
  trackRef,
  onClosed,
}: {
  photos: PropertyPhoto[];
  photoAlt: (index: number) => string;
  dialogRef: RefObject<HTMLDialogElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;
  onClosed: (lastIndex: number) => void;
}) {
  const t = useTranslations("property");
  const active = useActiveSlide(trackRef, photos.length);
  const total = photos.length;

  const go = useCallback(
    (index: number) => {
      if (index < 0 || index >= total) return;
      scrollToSlide(
        trackRef.current,
        index,
        prefersReducedMotion() ? "instant" : "smooth",
      );
    },
    [trackRef, total],
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const isRtl =
      getComputedStyle(event.currentTarget).direction === "rtl";
    const towardEnd = (event.key === "ArrowRight") !== isRtl;
    go(active + (towardEnd ? 1 : -1));
  }

  function handleClose() {
    trackRef.current
      ?.querySelectorAll("video")
      .forEach((video) => video.pause());
    onClosed(active);
  }

  const navButtonClass =
    "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow transition-opacity duration-150 disabled:pointer-events-none disabled:opacity-0 pointer-fine:flex";

  return (
    <dialog
      ref={dialogRef}
      aria-label={t("galleryTitle")}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white opacity-100 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] backdrop:bg-black starting:opacity-0"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t("galleryClose")}
            title={t("galleryClose")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <span
            dir="ltr"
            className="px-2 text-sm font-semibold tabular-nums"
            aria-live="polite"
          >
            {t("photoCounter", { index: active + 1, total })}
          </span>
        </div>

        <div className="relative min-h-0 flex-1">
          <div ref={trackRef} className={`${SCROLLER_CLASS} h-full`}>
            {photos.map((photo, index) => (
              <div
                key={photo.url}
                data-slide-index={index}
                className="flex h-full w-full shrink-0 snap-center items-center justify-center pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-20 sm:pb-6"
              >
                <Media
                  photo={photo}
                  alt={photoAlt(index)}
                  fit="contain"
                  className="max-h-full max-w-full"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label={t("galleryPrev")}
            className={`${navButtonClass} start-4`}
          >
            <ChevronStart />
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            disabled={active === total - 1}
            aria-label={t("galleryNext")}
            className={`${navButtonClass} end-4`}
          >
            <span className="flex -scale-x-100">
              <ChevronStart />
            </span>
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function PropertyGallery({
  photos,
  propertyId,
  shareText,
}: {
  photos: PropertyPhoto[];
  propertyId: string;
  shareText: string;
}) {
  const t = useTranslations("property");
  const router = useRouter();
  const total = photos.length;

  const carouselRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightboxTrackRef = useRef<HTMLDivElement>(null);
  const carouselIndex = useActiveSlide(carouselRef, total);

  const photoAlt = useCallback(
    (index: number) =>
      t("photoAlt", { title: shareText, index: index + 1, total }),
    [t, shareText, total],
  );

  function openLightbox(index: number) {
    const dialog = dialogRef.current;
    if (!dialog || total === 0) return;
    setPageScrollLocked(true);
    dialog.showModal();
    // The track only has a size once the dialog is displayed.
    scrollToSlide(lightboxTrackRef.current, index, "instant");
  }

  function handleLightboxClosed(lastIndex: number) {
    setPageScrollLocked(false);
    // Keep the mobile carousel on the photo the visitor was last looking at.
    scrollToSlide(carouselRef.current, lastIndex, "instant");
  }

  useEffect(
    () => () => {
      setPageScrollLocked(false);
    },
    [],
  );

  const thumbIndexes = photos
    .map((_, index) => index)
    .slice(1, 1 + DESKTOP_THUMB_COUNT);
  const thumbCount = thumbIndexes.length;
  const gridColsClass =
    thumbCount === 0
      ? "sm:grid-cols-1"
      : thumbCount <= 2
        ? "sm:grid-cols-[2fr_1fr]"
        : "sm:grid-cols-[2fr_1fr_1fr]";
  // A thumbnail fills both rows when it would otherwise leave a gap.
  const thumbSpansRows = (position: number) =>
    thumbCount === 1 || (thumbCount === 3 && position === 0);

  return (
    <>
      {/* Mobile: swipeable full-bleed carousel with overlaid controls */}
      <div className="relative sm:hidden">
        {total > 0 ? (
          <div
            ref={carouselRef}
            className={SCROLLER_CLASS}
            aria-roledescription="carousel"
            aria-label={t("galleryTitle")}
          >
            {photos.map((photo, index) => (
              <div
                key={photo.url}
                data-slide-index={index}
                className="w-full shrink-0 snap-center snap-always"
              >
                {photo.media_type === "video" ? (
                  <Media
                    photo={photo}
                    alt={photoAlt(index)}
                    className="aspect-[4/3] w-full"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => openLightbox(index)}
                    className="block w-full [-webkit-tap-highlight-color:transparent]"
                  >
                    <Media
                      photo={photo}
                      alt={photoAlt(index)}
                      eager={index === 0}
                      className="aspect-[4/3] w-full"
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-[4/3] w-full bg-placeholder" />
        )}

        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("back")}
          title={t("back")}
          className={`absolute top-3 start-3 ${OVERLAY_BUTTON_CLASS}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="rtl:-scale-x-100"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="absolute top-3 end-3 flex items-center gap-2">
          <ShareMenu
            shareText={shareText}
            buttonClassName={OVERLAY_BUTTON_CLASS}
            buttonSize={17}
          />
          <FavoriteButton
            propertyId={propertyId}
            className={OVERLAY_BUTTON_CLASS}
          />
        </div>

        {total > 1 && (
          <span
            dir="ltr"
            className="pointer-events-none absolute bottom-3 end-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white tabular-nums"
            aria-hidden="true"
          >
            {t("photoCounter", { index: carouselIndex + 1, total })}
          </span>
        )}
      </div>

      {/* Desktop: large lead photo + up to 4 thumbnails, all open the lightbox */}
      <div
        className={`relative hidden h-[440px] gap-2 overflow-hidden rounded-2xl sm:grid sm:grid-rows-2 ${gridColsClass}`}
      >
        {total > 0 ? (
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="group row-span-2 h-full w-full cursor-zoom-in overflow-hidden"
          >
            <Media
              photo={photos[0]}
              alt={photoAlt(0)}
              eager
              className="h-full w-full transition-[filter] duration-200 ease-out group-hover:brightness-90"
            />
          </button>
        ) : (
          <div className="row-span-2 h-full w-full bg-placeholder" />
        )}
        {thumbIndexes.map((index, position) => (
          <button
            key={photos[index].url}
            type="button"
            onClick={() => openLightbox(index)}
            className={`group h-full w-full cursor-zoom-in overflow-hidden ${
              thumbSpansRows(position) ? "row-span-2" : ""
            }`}
          >
            <Media
              photo={photos[index]}
              alt={photoAlt(index)}
              className="pointer-events-none h-full w-full transition-[filter] duration-200 ease-out group-hover:brightness-90"
            />
          </button>
        ))}

        {total > 1 && (
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 end-4 flex items-center gap-2 rounded-lg border border-ink bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-canvas"
          >
            <GridIcon />
            {t("showAllPhotos", { count: total })}
          </button>
        )}
      </div>

      {total > 0 && (
        <Lightbox
          photos={photos}
          photoAlt={photoAlt}
          dialogRef={dialogRef}
          trackRef={lightboxTrackRef}
          onClosed={handleLightboxClosed}
        />
      )}
    </>
  );
}
