"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import type { PropertyPhoto } from "@/lib/properties";
import FavoriteButton from "@/components/FavoriteButton";
import ShareMenu from "@/components/ShareMenu";

const OVERLAY_BUTTON_CLASS =
  "flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/90";

function Media({
  photo,
  className,
}: {
  photo: PropertyPhoto | undefined;
  className: string;
}) {
  if (!photo) return <div className={`${className} bg-placeholder`} />;
  return photo.media_type === "video" ? (
    <video
      src={optimizedCloudinaryUrl(photo.url)}
      className={className}
      muted
      controls
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={optimizedCloudinaryUrl(photo.url)} alt="" className={className} />
  );
}

export default function PropertyGallery({
  photos,
  propertyId,
  shareText,
}: {
  photos: PropertyPhoto[];
  propertyId: string;
  shareText: string;
}) {
  const t = useTranslations("property");
  const router = useRouter();
  const [selected, setSelected] = useState(0);

  const main = photos[selected];
  const otherIndexes = photos
    .map((_, index) => index)
    .filter((index) => index !== selected)
    .slice(0, 4);

  return (
    <>
      {/* Mobile: full-bleed photo with overlaid back/share/favorite + dots */}
      <div className="relative sm:hidden">
        <Media photo={main} className="h-[280px] w-full object-cover" />

        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("back")}
          title={t("back")}
          className={`absolute top-3.5 end-3.5 ${OVERLAY_BUTTON_CLASS}`}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="absolute top-3.5 start-3.5 flex items-center gap-2">
          <ShareMenu shareText={shareText} buttonClassName={OVERLAY_BUTTON_CLASS} buttonSize={16} />
          <FavoriteButton
            propertyId={propertyId}
            className={OVERLAY_BUTTON_CLASS}
          />
        </div>

        {photos.length > 1 && (
          <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.slice(0, 5).map((photo, index) => (
              <button
                key={photo.url}
                type="button"
                onClick={() => setSelected(index)}
                aria-label={t("selectPhoto", { index: index + 1 })}
                className={`block rounded-full ${
                  index === selected
                    ? "h-[7px] w-[7px] bg-white"
                    : "h-1.5 w-1.5 bg-white/55"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: large main photo + up to 4 thumbnails */}
      <div
        className={`hidden h-[420px] gap-2 overflow-hidden rounded-2xl sm:grid sm:grid-rows-2 ${
          otherIndexes.length > 0
            ? "sm:grid-cols-[2fr_1fr_1fr]"
            : "sm:grid-cols-1"
        }`}
      >
        <Media photo={main} className="row-span-2 h-full w-full object-cover" />
        {otherIndexes.map((index) => (
          <button
            key={photos[index].url}
            type="button"
            onClick={() => setSelected(index)}
            className="h-full w-full cursor-pointer overflow-hidden"
          >
            <Media
              photo={photos[index]}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </>
  );
}
