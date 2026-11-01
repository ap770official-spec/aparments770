/**
 * Map pin markup shared by the results map and the property page map:
 * listings are a house, 770 is its own dark marker with the building's
 * gables, so the two can never be confused. Plain DOM (Mapbox markers are
 * DOM elements, not React).
 */

// House drawn in the pin next to the price: "an apartment is here".
export const HOUSE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9v11h14V9"/><path d="M10 20v-5h4v5"/></svg>`;

// The 770 building's three gables, so the landmark never reads as a listing.
export const LANDMARK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 21h20"/><path d="M3 21V11l3-3 3 3v10"/><path d="M9 21V8l3-4 3 4v13"/><path d="M15 21V11l3-3 3 3v10"/><path d="M11 21v-4h2v4"/></svg>`;

/**
 * Pin markup. The wrapper element is Mapbox's (it owns the
 * `mapboxgl-marker` class and the positioning transform), so all styling
 * and selection state live on the inner button - overwriting the wrapper's
 * className is what used to knock pins off their coordinates.
 */
export const PIN_CLASS = [
  "relative flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[14px] font-bold whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-colors duration-150",
  "border-line bg-white text-ink",
  "data-[selected=true]:border-brand data-[selected=true]:bg-brand data-[selected=true]:text-brand-foreground",
  // Tail pointing at the exact spot.
  "after:absolute after:start-1/2 after:top-full after:-mt-[5px] after:h-2.5 after:w-2.5 after:-translate-x-1/2 after:rotate-45 after:border-e after:border-b after:border-inherit after:bg-inherit after:content-[''] rtl:after:translate-x-1/2",
  // Larger invisible hit area for fingers (the visible pin is 36px tall).
  "before:absolute before:-inset-x-1 before:-inset-y-1.5 before:content-['']",
  "[@media(hover:hover)]:hover:border-ink",
].join(" ");

/** House-only pin (no price) for "this apartment" on its own page. */
export const HOME_PIN_CLASS = PIN_CLASS.replace("px-2.5", "w-9 justify-center px-0");

export function createLandmarkElement(label: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.zIndex = "0";
  const safeLabel = label.replace(/[&<>"]/g, "");
  el.innerHTML = `
    <div class="flex flex-col items-center gap-1" role="img" aria-label="${safeLabel}">
      <div class="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-ink text-white shadow-[0_4px_14px_rgba(0,0,0,0.3)]">${LANDMARK_ICON}</div>
      <span class="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">${safeLabel}</span>
    </div>`;
  return el;
}

/** Mapbox UI strings (zoom buttons, gesture hints) in the page's language. */
export function mapUiLocale(t: (key: string) => string): Record<string, string> {
  return {
    "NavigationControl.ZoomIn": t("mapZoomIn"),
    "NavigationControl.ZoomOut": t("mapZoomOut"),
    "ScrollZoomBlocker.CtrlMessage": t("mapCtrlScroll"),
    "ScrollZoomBlocker.CmdMessage": t("mapCmdScroll"),
    "TouchPanBlocker.Message": t("mapTwoFingers"),
  };
}
