"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Suggestion = {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
};

const NYC_CENTER: [number, number] = [-73.95, 40.67];

/**
 * Address search + draggable-pin map for pinpointing a property's
 * exact location, independent of whatever the owner typed in the
 * free-text address field - that field stays for display, this is
 * what actually feeds lat/lng into the DB and the public map.
 */
export default function LocationPicker({
  initialLat,
  initialLng,
  onChange,
}: {
  initialLat?: number | null;
  initialLng?: number | null;
  onChange: (position: { lat: number; lng: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null
      ? { lat: initialLat, lng: initialLng }
      : null,
  );

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const startCenter: [number, number] = position
      ? [position.lng, position.lat]
      : NYC_CENTER;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: startCenter,
      zoom: position ? 15 : 11,
    });
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ draggable: true, color: "#171717" })
      .setLngLat(startCenter)
      .addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      setPosition({ lat, lng });
      onChange({ lat, lng });
    });

    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      const { lat, lng } = e.lngLat;
      setPosition({ lat, lng });
      onChange({ lat, lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(value: string) {
    setQuery(value);
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&proximity=${NYC_CENTER[0]},${NYC_CENTER[1]}&limit=5`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    setSuggestions(
      (data.features ?? []).map(
        (f: { id: string; place_name: string; center: [number, number] }) => ({
          id: f.id,
          placeName: f.place_name,
          lng: f.center[0],
          lat: f.center[1],
        }),
      ),
    );
  }

  function selectSuggestion(s: Suggestion) {
    setQuery(s.placeName);
    setSuggestions([]);
    setPosition({ lat: s.lat, lng: s.lng });
    onChange({ lat: s.lat, lng: s.lng });
    mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 15 });
    markerRef.current?.setLngLat([s.lng, s.lat]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="חפש כתובת..."
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-black/15 bg-background text-sm shadow-lg">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="block w-full px-3 py-2 text-start hover:bg-black/5"
                >
                  {s.placeName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-black/60">
        חפש כתובת ובחר מהרשימה, או לחץ/גרור את הסיכה על המפה לדיוק
      </p>
      <div ref={containerRef} className="h-64 w-full rounded-md" />
      {!position && (
        <p className="text-sm text-red-600">יש לסמן מיקום על המפה</p>
      )}
    </div>
  );
}
