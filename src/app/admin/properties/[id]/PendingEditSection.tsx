import type {
  AdminPropertyDetail,
  PropertyEdit,
  PropertyPhoto,
} from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import { approvePropertyEdit, rejectPropertyEdit } from "../../actions";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";
import he from "../../../../../messages/he.json";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: he.propertyForm.propertyTypeApartment,
  house: he.propertyForm.propertyTypeHouse,
  basement: he.propertyForm.propertyTypeBasement,
};

type Value = string | number | null | undefined;

function display(value: Value): string {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

function time(value: string | null): string | null {
  return value ? value.slice(0, 5) : null;
}

function amenityLabel(key: string): string {
  return he.amenities[key as keyof typeof he.amenities] ?? key;
}

function MediaThumb({
  photo,
  tag,
  tagClassName,
}: {
  photo: Pick<PropertyPhoto, "url" | "media_type">;
  tag?: string;
  tagClassName?: string;
}) {
  return (
    <div className="relative">
      {photo.media_type === "video" ? (
        <video
          src={optimizedCloudinaryUrl(photo.url)}
          controls
          className="aspect-square w-full rounded-lg bg-placeholder object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimizedCloudinaryUrl(photo.url)}
          alt=""
          className="aspect-square w-full rounded-lg bg-placeholder object-cover"
        />
      )}
      {tag && (
        <span
          className={`absolute start-1.5 top-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${tagClassName}`}
        >
          {tag}
        </span>
      )}
    </div>
  );
}

/**
 * Admin review of an owner's pending edit: only the fields that would
 * change, amenities added/removed, and the proposed media with new and
 * removed items marked. Approving applies it to the live listing.
 */
export default function PendingEditSection({
  property,
  edit,
  regionNames,
}: {
  property: AdminPropertyDetail;
  edit: PropertyEdit;
  regionNames: Record<string, string>;
}) {
  const next = edit.payload;

  const rows: { label: string; current: Value; proposed: Value }[] = [
    { label: "כתובת", current: property.address, proposed: next.address },
    {
      label: "אזור",
      current: regionNames[property.region_id],
      proposed: regionNames[next.regionId],
    },
    {
      label: "סוג נכס",
      current: PROPERTY_TYPE_LABELS[property.property_type],
      proposed: PROPERTY_TYPE_LABELS[next.propertyType],
    },
    {
      label: "הערות לכתובת",
      current: property.address_notes,
      proposed: next.addressNotes,
    },
    {
      label: "מחיר ללילה",
      current: `$${property.price_per_night}`,
      proposed: `$${next.pricePerNight}`,
    },
    { label: "חדרי שינה", current: property.bedrooms, proposed: next.bedrooms },
    { label: "מיטות", current: property.beds, proposed: next.beds },
    { label: "שירותים", current: property.toilets, proposed: next.toilets },
    { label: "אמבטיות", current: property.bathtubs, proposed: next.bathtubs },
    {
      label: "מקסימום אורחים",
      current: property.max_guests,
      proposed: next.maxGuests,
    },
    {
      label: "מינימום לילות",
      current: property.min_nights,
      proposed: next.minNights,
    },
    {
      label: "צ'ק-אין",
      current: time(property.checkin_time),
      proposed: time(next.checkinTime),
    },
    {
      label: "צ'ק-אאוט",
      current: time(property.checkout_time),
      proposed: time(next.checkoutTime),
    },
    {
      label: "טלפון",
      current: `${property.phone_country_code} ${property.phone_number}`,
      proposed: `${next.phoneCountryCode} ${next.phoneNumber}`,
    },
    {
      label: "תיאור (עברית)",
      current: property.description_he,
      proposed: next.descriptionHe,
    },
    {
      label: "תיאור (אנגלית)",
      current: property.description_en,
      proposed: next.descriptionEn,
    },
  ];
  const changedRows = rows.filter(
    (row) => display(row.current) !== display(row.proposed),
  );

  const currentAmenities = new Set(
    property.property_amenities.map((a) => a.amenity_key),
  );
  const proposedAmenities = new Set(next.amenities.map((a) => a.amenityKey));
  const addedAmenities = [...proposedAmenities].filter(
    (key) => !currentAmenities.has(key),
  );
  const removedAmenities = [...currentAmenities].filter(
    (key) => !proposedAmenities.has(key),
  );

  const currentMedia = [...property.property_photos].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const currentUrls = new Set(currentMedia.map((m) => m.url));
  const proposedUrls = new Set(next.media.map((m) => m.url));
  const removedMedia = currentMedia.filter((m) => !proposedUrls.has(m.url));
  const mediaChanged =
    removedMedia.length > 0 ||
    next.media.length !== currentMedia.length ||
    next.media.some((m, i) => currentMedia[i]?.url !== m.url);

  const nothingChanged =
    changedRows.length === 0 &&
    addedAmenities.length === 0 &&
    removedAmenities.length === 0 &&
    !mediaChanged;

  return (
    <section
      id="pending-edit"
      aria-labelledby="pending-edit-title"
      className="mt-5 scroll-mt-4 rounded-2xl border border-amber-400/70 bg-amber-50 p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="pending-edit-title" className="text-base font-bold text-ink">
            בעל הדירה שלח עריכה שממתינה לאישור
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            נשלחה ב-
            {new Date(edit.created_at).toLocaleString("en-GB", {
              dateStyle: "short",
              timeStyle: "short",
            })}
            . עד האישור הדירה מוצגת באתר כפי שהיא למטה.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <form action={approvePropertyEdit.bind(null, edit.id)}>
            <PendingSubmitButton
              pendingLabel="מאשר…"
              className="min-h-11 cursor-pointer rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              אשר עריכה
            </PendingSubmitButton>
          </form>
          <form action={rejectPropertyEdit.bind(null, edit.id)}>
            <PendingSubmitButton
              pendingLabel="דוחה…"
              confirmMessage="לדחות את העריכה? הדירה תישאר באתר כפי שהיא."
              className="min-h-11 cursor-pointer rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold text-ink hover:bg-black/5 disabled:cursor-wait disabled:opacity-60"
            >
              דחה עריכה
            </PendingSubmitButton>
          </form>
        </div>
      </div>

      {nothingChanged && (
        <p className="mt-4 text-sm text-black/70">
          לא נמצאו הבדלים מהגרסה הנוכחית.
        </p>
      )}

      {changedRows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-black/60">
                <th className="p-3 text-start font-medium">שדה</th>
                <th className="p-3 text-start font-medium">עכשיו באתר</th>
                <th className="p-3 text-start font-medium">אחרי העריכה</th>
              </tr>
            </thead>
            <tbody>
              {changedRows.map((row) => (
                <tr key={row.label} className="border-b border-black/5 align-top">
                  <td className="p-3 text-black/60">{row.label}</td>
                  <td
                    dir="auto"
                    className="p-3 whitespace-pre-wrap text-start text-black/50 line-through decoration-black/30"
                  >
                    {display(row.current)}
                  </td>
                  <td
                    dir="auto"
                    className="p-3 whitespace-pre-wrap text-start font-semibold text-ink"
                  >
                    {display(row.proposed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(addedAmenities.length > 0 || removedAmenities.length > 0) && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">שירותים</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {addedAmenities.map((key) => (
              <li
                key={key}
                className="rounded-full border border-green-300 bg-green-50 px-3 py-1 text-sm text-green-800"
              >
                + {amenityLabel(key)}
              </li>
            ))}
            {removedAmenities.map((key) => (
              <li
                key={key}
                className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 line-through"
              >
                {amenityLabel(key)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mediaChanged && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">
            תמונות/וידאו אחרי העריכה ({next.media.length})
          </h3>
          {next.media.length > 0 ? (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {next.media.map((m, i) => (
                <MediaThumb
                  key={m.url}
                  photo={{ url: m.url, media_type: m.mediaType }}
                  tag={
                    !currentUrls.has(m.url)
                      ? "חדש"
                      : i === 0
                        ? "ראשית"
                        : undefined
                  }
                  tagClassName={
                    !currentUrls.has(m.url)
                      ? "bg-green-600 text-white"
                      : "bg-black/70 text-white"
                  }
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-black/60">ללא תמונות.</p>
          )}

          {removedMedia.length > 0 && (
            <>
              <h3 className="mt-4 text-sm font-semibold">
                יוסרו ({removedMedia.length})
              </h3>
              <div className="mt-2 grid grid-cols-3 gap-2 opacity-70 sm:grid-cols-4">
                {removedMedia.map((m) => (
                  <MediaThumb
                    key={m.url}
                    photo={m}
                    tag="יוסר"
                    tagClassName="bg-red-600 text-white"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
