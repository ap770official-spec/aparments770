"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("search");
  const listRef = useRef<HTMLUListElement>(null);
  const unlocatedCount = properties.filter(
    (p) => p.lat == null || p.lng == null,
  ).length;
  const hasLocated = unlocatedCount < properties.length;

  // A pin clicked on the desktop map scrolls its card into view in the list.
  function selectFromMap(id: string) {
    setSelectedId(id);
    const card = listRef.current?.querySelector(`[data-card-id="${id}"]`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }

  const unlocatedNote =
    hasLocated && unlocatedCount > 0 ? (
      <p className="text-[14px] text-ink-soft">
        {t("mapUnlocated", { count: unlocatedCount })}
      </p>
    ) : null;

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
              <ul
                ref={listRef}
                className="flex h-full w-[380px] shrink-0 flex-col gap-3.5 overflow-y-auto p-0.5"
              >
                {properties.map((property) => (
                  // shrink-0: in this fixed-height column the cards would
                  // otherwise squash their photos instead of scrolling.
                  <li key={property.id} data-card-id={property.id} className="shrink-0">
                    <CompactPropertyCard
                      property={property}
                      detailHref={`/property/${property.id}?${searchQuery}`}
                      landmarkLabel={landmarkLabel}
                      orientation="vertical"
                      selected={selectedId === property.id}
                      onMouseEnter={() => setSelectedId(property.id)}
                      searchQuery={searchQuery}
                    />
                  </li>
                ))}
              </ul>
              <div className="flex h-full flex-1 flex-col gap-2">
                <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">
                  <SearchResultsMap
                    properties={properties}
                    landmark={landmark}
                    landmarkLabel={landmarkLabel}
                    selectedId={selectedId}
                    onSelect={selectFromMap}
                  />
                </div>
                {unlocatedNote}
              </div>
            </div>
          ) : (
            // Mobile: map on top, one summary card for the selected pin below
            <div className="flex flex-col gap-3">
              <div className="h-[60svh] max-h-[560px] min-h-80 w-full overflow-hidden rounded-2xl">
                <SearchResultsMap
                  properties={properties}
                  landmark={landmark}
                  landmarkLabel={landmarkLabel}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
              {unlocatedNote}
              {selectedProperty && (
                <CompactPropertyCard
                  property={selectedProperty}
                  detailHref={`/property/${selectedProperty.id}?${searchQuery}`}
                  landmarkLabel={landmarkLabel}
                  orientation="horizontal"
                  searchQuery={searchQuery}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
