"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PropertySummary } from "@/lib/properties";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerElsRef = useRef<Record<string, HTMLButtonElement>>({});
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  function markerClassName(isSelected: boolean) {
    return isSelected
      ? "rounded-full border border-brand bg-brand px-3 py-[7px] text-[13px] font-bold text-brand-foreground shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-colors"
      : "rounded-full border border-[#E5DED3] bg-white px-3 py-[7px] text-[13px] font-bold text-[#1A1512] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-colors";
  }

  const located = properties.filter(
    (p): p is PropertySummary & { lat: number; lng: number } =>
      p.lat != null && p.lng != null,
  );

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || located.length === 0) return;

    // eslint-disable-next-line react-hooks/immutability -- required by the mapbox-gl API; same pattern as Map.tsx/LocationPicker.tsx
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [located[0].lng, located[0].lat],
      zoom: 13,
    });
    mapRef.current = map;

    const bounds = new mapboxgl.LngLatBounds();

    for (const property of located) {
      const el = document.createElement("button");
      el.type = "button";
      el.dataset.propertyId = property.id;
      el.className = markerClassName(property.id === selectedId);
      el.textContent = `$${property.price_per_night}`;
      el.addEventListener("click", () => onSelectRef.current(property.id));
      markerElsRef.current[property.id] = el;

      new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([property.lng, property.lat])
        .addTo(map);
      bounds.extend([property.lng, property.lat]);
    }

    if (landmark) {
      const el = document.createElement("div");
      el.className = "flex flex-col items-center gap-1";
      el.innerHTML = `
        <div class="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-brand shadow-[0_4px_14px_rgba(0,0,0,0.25)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 11l9-8 9 8"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>
          </svg>
        </div>
        <span class="rounded-full bg-brand px-[10px] py-[3px] text-[11px] font-bold text-brand-foreground">${landmarkLabel ?? "770"}</span>
      `;
      new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([landmark.lng, landmark.lat])
        .addTo(map);
      bounds.extend([landmark.lng, landmark.lat]);
    }

    if (located.length > 1 || landmark) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerElsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located.map((p) => p.id).join(","), landmark?.lat, landmark?.lng]);

  useEffect(() => {
    for (const [id, el] of Object.entries(markerElsRef.current)) {
      el.className = markerClassName(id === selectedId);
    }
  }, [selectedId]);

  if (located.length === 0) {
    return null;
  }

  return <div ref={containerRef} className="h-full w-full rounded-lg" />;
}
