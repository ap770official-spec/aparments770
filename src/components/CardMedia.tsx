import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import type { PropertyPhoto } from "@/lib/properties";

export function CardMedia({
  media,
  className,
  eager = false,
}: {
  media: PropertyPhoto | null | undefined;
  className: string;
  eager?: boolean;
}) {
  if (!media) return <div className={`${className} bg-placeholder`} />;
  if (media.media_type === "video") {
    // A still first frame with a play badge: the card is a link, so a video
    // with its own controls would swallow the tap meant to open the listing.
    return (
      <div className={`relative ${className}`}>
        <video
          src={`${optimizedCloudinaryUrl(media.url)}#t=0.1`}
          className="pointer-events-none h-full w-full object-cover"
          preload="metadata"
          muted
          playsInline
          tabIndex={-1}
          aria-hidden="true"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" />
            </svg>
          </span>
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizedCloudinaryUrl(media.url)}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`${className} object-cover`}
    />
  );
}
