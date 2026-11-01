"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PropertySummary } from "@/lib/properties";
import {
  HOUSE_ICON,
  PIN_CLASS,
  createLandmarkElement,
  mapUiLocale,
} from "@/lib/mapPins";

type LocatedProperty = PropertySummary & { lat: number; lng: number };

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
      locale: mapUiLocale(t),
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
      const el = createLandmarkElement(landmarkLabel ?? "770");
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
      map.fitBounds(bounds, {
        // Extra top room: the 770 marker stands tall above its point.
        padding: { top: 100, bottom: 50, left: 60, right: 60 },
        maxZoom: 16,
        duration: 0,
      });
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
