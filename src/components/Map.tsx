"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export type MapMarker = {
  lat: number;
  lng: number;
  color?: string;
  label?: string;
};

export default function Map({
  markers,
  className,
}: {
  markers: MapMarker[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || markers.length === 0) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [markers[0].lng, markers[0].lat],
      zoom: 14,
    });
    mapRef.current = map;

    for (const marker of markers) {
      const el = document.createElement("div");
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
      el.style.background = marker.color ?? "#171717";

      const mbMarker = new mapboxgl.Marker({ element: el });
      if (marker.label) {
        mbMarker.setPopup(new mapboxgl.Popup({ offset: 12 }).setText(marker.label));
      }
      mbMarker.setLngLat([marker.lng, marker.lat]).addTo(map);
    }

    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      for (const marker of markers) bounds.extend([marker.lng, marker.lat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers)]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-80 w-full rounded-md"}
    />
  );
}
