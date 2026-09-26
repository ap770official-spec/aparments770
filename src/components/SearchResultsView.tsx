"use client";

import { useState } from "react";
import type { PropertySummary } from "@/lib/properties";
import PropertyCard from "@/components/PropertyCard";
import SearchResultsMap from "@/components/SearchResultsMap";

export default function SearchResultsView({
  properties,
  searchQuery,
  labels,
}: {
  properties: PropertySummary[];
  searchQuery: string;
  labels: {
    listView: string;
    mapView: string;
    perNight: string;
    viewDetails: string;
  };
}) {
  const [view, setView] = useState<"list" | "map">("list");

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
        <div className="mt-6">
          <SearchResultsMap
            properties={properties}
            detailHrefFor={(id) => `/property/${id}?${searchQuery}`}
            perNightLabel={labels.perNight}
            viewDetailsLabel={labels.viewDetails}
          />
        </div>
      )}
    </div>
  );
}
