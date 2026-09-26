"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PropertySummary } from "@/lib/properties";

export default function SearchResultsMap({
  properties,
  detailHrefFor,
  perNightLabel,
  viewDetailsLabel,
}: {
  properties: PropertySummary[];
  detailHrefFor: (propertyId: string) => string;
  perNightLabel: string;
  viewDetailsLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

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

    for (const property of located) {
      const popupNode = document.createElement("div");
      popupNode.className = "text-sm";
      popupNode.innerHTML = `
        <p class="font-medium">${property.address}</p>
        <p class="font-semibold">$${property.price_per_night} ${perNightLabel}</p>
        <a href="${detailHrefFor(property.id)}" class="mt-1 inline-block underline underline-offset-2">${viewDetailsLabel}</a>
      `;

      new mapboxgl.Marker({ color: "#171717" })
        .setLngLat([property.lng, property.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setDOMContent(popupNode))
        .addTo(map);
    }

    if (located.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      for (const property of located) bounds.extend([property.lng, property.lat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
    }

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located.map((p) => p.id).join(",")]);

  if (located.length === 0) {
    return null;
  }

  return <div ref={containerRef} className="h-[28rem] w-full rounded-lg" />;
}
