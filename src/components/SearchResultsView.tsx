"use client";

import { useState, useSyncExternalStore } from "react";
import type { PropertySummary } from "@/lib/properties";
import PropertyCard from "@/components/PropertyCard";
import CompactPropertyCard from "@/components/CompactPropertyCard";
import SearchResultsMap from "@/components/SearchResultsMap";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktopQuery(callback: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/**
 * Mobile and desktop render genuinely different DOM for the map view
 * (single summary card vs. side list), and mounting both at once would
 * mean two live Mapbox instances - one sized 0x0 behind `hidden`. This
 * picks one at a time instead of relying on CSS display alone.
 * useSyncExternalStore (not an effect) is the React-idiomatic way to
 * read external browser state like matchMedia without an extra render.
 */
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeToDesktopQuery,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

export default function SearchResultsView({
  properties,
  searchQuery,
  landmark,
  landmarkLabel,
  labels,
}: {
  properties: PropertySummary[];
  searchQuery: string;
  landmark?: { lat: number; lng: number } | null;
  landmarkLabel?: string;
  labels: {
    listView: string;
    mapView: string;
    perNight: string;
    viewDetails: string;
  };
}) {
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(
    properties[0]?.id ?? null,
  );
  const selectedProperty =
    properties.find((p) => p.id === selectedId) ?? properties[0] ?? null;
  const isDesktop = useIsDesktop();

  return (
    <div>
      <div className="mt-6 flex gap-1.5">
        <button
          type="button"
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold ${
            view === "list"
              ? "border-brand bg-brand text-brand-foreground"
              : "border-[#E5DED3] text-[#1A1512]"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {labels.listView}
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          aria-pressed={view === "map"}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold ${
            view === "map"
              ? "border-brand bg-brand text-brand-foreground"
              : "border-[#E5DED3] text-[#1A1512]"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          {labels.mapView}
        </button>
      </div>

      {view === "list" ? (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              detailHref={`/property/${property.id}?${searchQuery}`}
              searchQuery={searchQuery}
              landmarkLabel={landmarkLabel}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-6">
          {isDesktop ? (
            // Desktop: side list + map, matching the map-view mockup
            <div className="flex gap-7" style={{ height: "40rem" }}>
              <ul className="flex h-full w-[380px] shrink-0 flex-col gap-3.5 overflow-y-auto ps-0.5">
                {properties.map((property) => (
                  <CompactPropertyCard
                    key={property.id}
                    property={property}
                    detailHref={`/property/${property.id}?${searchQuery}`}
                    landmarkLabel={landmarkLabel}
                    orientation="vertical"
                    selected={selectedId === property.id}
                    onMouseEnter={() => setSelectedId(property.id)}
                  />
                ))}
              </ul>
              <div className="h-full flex-1 overflow-hidden rounded-2xl">
                <SearchResultsMap
                  properties={properties}
                  landmark={landmark}
                  landmarkLabel={landmarkLabel}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
            </div>
          ) : (
            // Mobile: map on top, one summary card for the selected pin below
            <div className="flex flex-col gap-3">
              <div className="h-80 w-full overflow-hidden rounded-2xl">
                <SearchResultsMap
                  properties={properties}
                  landmark={landmark}
                  landmarkLabel={landmarkLabel}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
              {selectedProperty && (
                <CompactPropertyCard
                  property={selectedProperty}
                  detailHref={`/property/${selectedProperty.id}?${searchQuery}`}
                  orientation="horizontal"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
