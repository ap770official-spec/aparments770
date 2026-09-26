"use client";

import { useState } from "react";
import type { PropertySummary } from "@/lib/properties";
import PropertyCard from "@/components/PropertyCard";
import SearchResultsMap from "@/components/SearchResultsMap";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setView("map")}
          aria-pressed={view === "map"}
          className={`rounded-full border border-black/15 px-4 py-2 text-sm ${
            view === "map" ? "bg-brand text-brand-foreground" : ""
          }`}
        >
          {labels.mapView}
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          className={`rounded-full border border-black/15 px-4 py-2 text-sm ${
            view === "list" ? "bg-brand text-brand-foreground" : ""
          }`}
        >
          {labels.listView}
        </button>
      </div>

      {view === "list" ? (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              detailHref={`/property/${property.id}?${searchQuery}`}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="order-2 h-[32rem] lg:order-1 lg:h-[42rem]">
            <SearchResultsMap
              properties={properties}
              landmark={landmark}
              landmarkLabel={landmarkLabel}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <ul className="order-1 grid gap-4 lg:order-2 lg:h-[42rem] lg:auto-rows-min lg:overflow-y-auto lg:pe-1">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                detailHref={`/property/${property.id}?${searchQuery}`}
                onMouseEnter={() => setSelectedId(property.id)}
                className={selectedId === property.id ? "ring-2 ring-brand" : ""}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
