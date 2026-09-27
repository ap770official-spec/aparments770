"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AmenityIcon } from "@/lib/amenityIcons";

type AmenityGroup = {
  category: string;
  items: { amenity_key: string }[];
};

const PREVIEW_COUNT = 8;

export default function PropertyAmenities({
  groups,
}: {
  groups: AmenityGroup[];
}) {
  const t = useTranslations("property");
  const tCategory = useTranslations("amenityCategories");
  const tAmenity = useTranslations("amenities");
  const [showAll, setShowAll] = useState(false);

  const allItems = groups.flatMap((group) => group.items);
  const totalCount = allItems.length;
  const previewItems = allItems.slice(0, PREVIEW_COUNT);
  const canExpand = totalCount > PREVIEW_COUNT;

  if (totalCount === 0) return null;

  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="text-lg font-bold text-ink sm:text-[19px]">
        {t("amenitiesTitle")}
      </h2>

      {(!canExpand || !showAll) && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {previewItems.map((item) => (
            <div key={item.amenity_key} className="flex items-center gap-3">
              <AmenityIcon amenityKey={item.amenity_key} className="text-ink" />
              <span className="text-sm text-ink">
                {tAmenity(item.amenity_key)}
              </span>
            </div>
          ))}
        </div>
      )}

      {canExpand && showAll && (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.category} className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-[#5C5349]">
                {tCategory(group.category)}
              </h3>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
                {group.items.map((item) => (
                  <div
                    key={item.amenity_key}
                    className="flex items-center gap-2.5"
                  >
                    <AmenityIcon
                      amenityKey={item.amenity_key}
                      size={19}
                      className="text-ink"
                    />
                    <span className="text-[13.5px] text-ink">
                      {tAmenity(item.amenity_key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {canExpand && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="flex w-fit items-center gap-1.5 py-1 text-sm font-semibold text-ink"
        >
          {showAll
            ? t("showFewerAmenities")
            : t("showAllAmenities", { count: totalCount })}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={showAll ? "rotate-180" : ""}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
