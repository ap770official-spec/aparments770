"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PropertySummary } from "@/lib/properties";

type LocatedProperty = PropertySummary & { lat: number; lng: number };

// House drawn in the pin next to the price: "an apartment is here".
const HOUSE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9v11h14V9"/><path d="M10 20v-5h4v5"/></svg>`;

// The 770 building's three gables, so the landmark never reads as a listing.
const LANDMARK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 21h20"/><path d="M3 21V11l3-3 3 3v10"/><path d="M9 21V8l3-4 3 4v13"/><path d="M15 21V11l3-3 3 3v10"/><path d="M11 21v-4h2v4"/></svg>`;

/**
 * Pin markup. The wrapper element is Mapbox's (it owns the
 * `mapboxgl-marker` class and the positioning transform), so all styling
 * and selection state live on the inner button - overwriting the wrapper's
 * className is what used to knock pins off their coordinates.
 */
const PIN_CLASS = [
  "relative flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[14px] font-bold whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-colors duration-150",
  "border-line bg-white text-ink",
  "data-[selected=true]:border-brand data-[selected=true]:bg-brand data-[selected=true]:text-brand-foreground",
  // Tail pointing at the exact spot.
  "after:absolute after:start-1/2 after:top-full after:-mt-[5px] after:h-2.5 after:w-2.5 after:-translate-x-1/2 after:rotate-45 after:border-e after:border-b after:border-inherit after:bg-inherit after:content-[''] rtl:after:translate-x-1/2",
  // Larger invisible hit area for fingers (the visible pin is 36px tall).
  "before:absolute before:-inset-x-1 before:-inset-y-1.5 before:content-['']",
  "[@media(hover:hover)]:hover:border-ink",
].join(" ");

export default function SearchResultsMap({
  properties,
  landmark,
  landmarkLabel,
  selectedId,
  onSelect,
}: {
  properties: PropertySummary[];
  landmark?: { lat: number; lng: number } | null;
  landmarkLabel?: string;
  selectedId: string | null;
  onSelect: (propertyId: string) => void;
}) {
  const t = useTranslations("search");
  const tProperty = useTranslations("property");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pinsRef = useRef<
    Record<string, { wrapper: HTMLElement; button: HTMLButtonElement; lngLat: [number, number] }>
  >({});
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const located = properties.filter(
    (p): p is LocatedProperty => p.lat != null && p.lng != null,
  );

  function applySelection(id: string | null) {
    for (const [pinId, pin] of Object.entries(pinsRef.current)) {
      const isSelected = pinId === id;
      pin.button.dataset.selected = String(isSelected);
      pin.button.setAttribute("aria-pressed", String(isSelected));
      // Selected pin always paints above its neighbours.
      pin.wrapper.style.zIndex = isSelected ? "2" : "1";
    }
  }

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || located.length === 0) return;

    // eslint-disable-next-line react-hooks/immutability -- required by the mapbox-gl API; same pattern as Map.tsx/LocationPicker.tsx
    mapboxgl.accessToken = token;
    const isRtl = locale === "he";
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [located[0].lng, located[0].lat],
      zoom: 13,
      // Page scroll passes over the map; zooming needs ctrl/⌘ + wheel and
      // panning on phones needs two fingers, with a hint when tried.
      cooperativeGestures: true,
      locale: {
        "NavigationControl.ZoomIn": t("mapZoomIn"),
        "NavigationControl.ZoomOut": t("mapZoomOut"),
        "ScrollZoomBlocker.CtrlMessage": t("mapCtrlScroll"),
        "ScrollZoomBlocker.CmdMessage": t("mapCmdScroll"),
        "TouchPanBlocker.Message": t("mapTwoFingers"),
      },
    });
    mapRef.current = map;
    // Zoom buttons on the reading-end side, away from the list.
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      isRtl ? "top-left" : "top-right",
    );

    const bounds = new mapboxgl.LngLatBounds();

    // Landmark first so property pins paint above it when they cluster.
    if (landmark) {
      const el = document.createElement("div");
      el.style.zIndex = "0";
      el.innerHTML = `
        <div class="flex flex-col items-center gap-1" role="img" aria-label="${landmarkLabel ?? "770"}">
          <div class="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-ink text-white shadow-[0_4px_14px_rgba(0,0,0,0.3)]">${LANDMARK_ICON}</div>
          <span class="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">${landmarkLabel ?? "770"}</span>
        </div>`;
      new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([landmark.lng, landmark.lat])
        .addTo(map);
      bounds.extend([landmark.lng, landmark.lat]);
    }

    for (const property of located) {
      const wrapper = document.createElement("div");
      const button = document.createElement("button");
      button.type = "button";
      button.className = PIN_CLASS;
      button.dataset.propertyId = property.id;
      const price = `$${property.price_per_night.toLocaleString("en-US")}`;
      button.innerHTML = `${HOUSE_ICON}<span>${price}</span>`;
      button.setAttribute(
        "aria-label",
        `${property.address}, ${price} ${tProperty("perNightSuffix")}`,
      );
      button.addEventListener("click", () => onSelectRef.current(property.id));
      wrapper.appendChild(button);

      const lngLat: [number, number] = [property.lng, property.lat];
      // Offset for the tail so its tip, not the pill, marks the spot.
      new mapboxgl.Marker({ element: wrapper, anchor: "bottom", offset: [0, -6] })
        .setLngLat(lngLat)
        .addTo(map);
      pinsRef.current[property.id] = { wrapper, button, lngLat };
      bounds.extend(lngLat);
    }
    applySelection(selectedRef.current);

    if (located.length > 1 || landmark) {
      map.fitBounds(bounds, { padding: 70, maxZoom: 16, duration: 0 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      pinsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located.map((p) => p.id).join(","), landmark?.lat, landmark?.lng, locale]);

  // Highlight the selected pin, and bring it into view if it's off-screen
  // (e.g. hovering a card in the desktop list).
  useEffect(() => {
    selectedRef.current = selectedId;
    applySelection(selectedId);
    const map = mapRef.current;
    const pin = selectedId ? pinsRef.current[selectedId] : undefined;
    if (map && pin && !map.getBounds()?.contains(pin.lngLat)) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      map.easeTo({ center: pin.lngLat, duration: reduce ? 0 : 400 });
    }
  }, [selectedId]);

  if (located.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-canvas p-6 text-center text-[15px] text-ink-soft">
        {t("mapNoLocations")}
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full rounded-lg" />;
}
