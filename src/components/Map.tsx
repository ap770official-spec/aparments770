"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  HOUSE_ICON,
  HOME_PIN_CLASS,
  createLandmarkElement,
  mapUiLocale,
} from "@/lib/mapPins";

export type MapMarker = {
  lat: number;
  lng: number;
  /** "home" = the apartment (house pin), "landmark" = 770. */
  kind: "home" | "landmark";
  label?: string;
};

/** Small location map on the property page: the apartment and 770. */
export default function Map({
  markers,
  className,
}: {
  markers: MapMarker[];
  className?: string;
}) {
  const t = useTranslations("search");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || markers.length === 0) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [markers[0].lng, markers[0].lat],
      zoom: 15,
      // Don't trap page scroll: two fingers to pan, ctrl/⌘ + wheel to zoom.
      cooperativeGestures: true,
      locale: mapUiLocale(t),
    });
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      locale === "he" ? "top-left" : "top-right",
    );

    // Landmark first so the apartment pin paints above it if they're close.
    const ordered = [...markers].sort((a) => (a.kind === "landmark" ? -1 : 1));
    for (const marker of ordered) {
      let element: HTMLElement;
      if (marker.kind === "landmark") {
        element = createLandmarkElement(marker.label ?? "770");
      } else {
        element = document.createElement("div");
        element.style.zIndex = "1";
        const pin = document.createElement("div");
        pin.className = HOME_PIN_CLASS;
        pin.dataset.selected = "true";
        pin.setAttribute("role", "img");
        if (marker.label) pin.setAttribute("aria-label", marker.label);
        pin.innerHTML = HOUSE_ICON;
        element.appendChild(pin);
      }
      new mapboxgl.Marker({
        element,
        anchor: "bottom",
        offset: marker.kind === "home" ? [0, -6] : [0, 0],
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
    }

    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      for (const marker of markers) bounds.extend([marker.lng, marker.lat]);
      map.fitBounds(bounds, {
        // Extra top room: the 770 marker stands tall above its point.
        padding: { top: 100, bottom: 50, left: 60, right: 60 },
        maxZoom: 16,
        duration: 0,
      });
    }

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers), locale]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-80 w-full rounded-md"}
    />
  );
}
