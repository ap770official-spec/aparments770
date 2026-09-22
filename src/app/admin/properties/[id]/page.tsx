import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAdminPropertyById } from "@/lib/properties";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { approveProperty, rejectProperty } from "../../actions";
import he from "../../../../../messages/he.json";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "ממתין לאישור",
  approved: "מאושר",
  rejected: "נדחה",
};

const AMENITY_CATEGORY_ORDER = ["general", "shabbat_kosher", "proximity"] as const;

function defaultExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 365);
  return d.toISOString().slice(0, 10);
}

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const property = await getAdminPropertyById(supabase, id);

  if (!property) {
    notFound();
  }

  const amenitiesByCategory = AMENITY_CATEGORY_ORDER.map((category) => ({
    category,
    items: property.property_amenities.filter((a) => a.category === category),
  })).filter((group) => group.items.length > 0);

  const phoneHref = `tel:${property.phone_country_code}${property.phone_number}`;
  const whatsappHref = buildWhatsAppLink({
    countryCode: property.phone_country_code,
    phoneNumber: property.phone_number,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/admin/properties" className="text-sm underline underline-offset-2">
        ← חזרה לרשימה
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{property.address}</h1>
        <span className="shrink-0 rounded-md border border-black/15 px-3 py-1 text-sm">
          {STATUS_LABELS[property.approval_status] ?? property.approval_status}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {property.approval_status !== "approved" && (
          <form
            action={approveProperty.bind(null, property.id)}
            className="flex items-center gap-2"
          >
            <label className="flex items-center gap-1 text-sm">
              בתוקף עד
              <input
                type="date"
                name="expiresAt"
                defaultValue={defaultExpiryDate()}
                required
                className="rounded-md border border-black/15 px-2 py-1 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-foreground px-3 py-1 text-background"
            >
              אשר
            </button>
          </form>
        )}
        {property.approval_status !== "rejected" && (
          <form action={rejectProperty.bind(null, property.id)}>
            <button
              type="submit"
              className="rounded-md border border-black/15 px-3 py-1"
            >
              דחה
            </button>
          </form>
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-semibold">פרטי קשר</h2>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-black/60">בעל הדירה</dt>
          <dd>{property.owners?.full_name ?? "—"}</dd>
          <dt className="text-black/60">טלפון</dt>
          <dd>
            {property.phone_country_code} {property.phone_number}
          </dd>
          <dt className="text-black/60">מנוי בתוקף עד</dt>
          <dd>
            {property.owners?.subscription_expires_at
              ? new Date(property.owners.subscription_expires_at).toLocaleDateString(
                  "en-GB",
                )
              : "לא הוגדר"}
            {property.owners?.is_frozen && " (מוקפא)"}
          </dd>
        </dl>
        <div className="mt-3 flex gap-3">
          <a
            href={phoneHref}
            className="rounded-md border border-black/15 px-3 py-1 text-sm"
          >
            חייג
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-black/15 px-3 py-1 text-sm"
          >
            פתח וואטסאפ
          </a>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">פרטי הדירה</h2>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-black/60">אזור</dt>
          <dd>{property.regions?.name_he ?? "—"}</dd>
          <dt className="text-black/60">מחיר ללילה</dt>
          <dd>${property.price_per_night}</dd>
          <dt className="text-black/60">חדרי שינה</dt>
          <dd>{property.bedrooms}</dd>
          <dt className="text-black/60">מיטות</dt>
          <dd>{property.beds}</dd>
          <dt className="text-black/60">שירותים</dt>
          <dd>{property.toilets}</dd>
          <dt className="text-black/60">אמבטיות</dt>
          <dd>{property.bathtubs}</dd>
          <dt className="text-black/60">מקסימום אורחים</dt>
          <dd>{property.max_guests ?? "—"}</dd>
          <dt className="text-black/60">מינימום לילות</dt>
          <dd>{property.min_nights ?? "—"}</dd>
          <dt className="text-black/60">צ&#39;ק-אין</dt>
          <dd>{property.checkin_time ?? "—"}</dd>
          <dt className="text-black/60">צ&#39;ק-אאוט</dt>
          <dd>{property.checkout_time ?? "—"}</dd>
        </dl>
      </section>

      {(property.description_he || property.description_en) && (
        <section className="mt-8">
          <h2 className="font-semibold">תיאור</h2>
          {property.description_he && (
            <p className="mt-2 text-sm whitespace-pre-wrap">
              {property.description_he}
            </p>
          )}
          {property.description_en && (
            <p className="mt-2 text-sm whitespace-pre-wrap" dir="ltr">
              {property.description_en}
            </p>
          )}
        </section>
      )}

      {amenitiesByCategory.length > 0 && (
        <section className="mt-8">
          <h2 className="font-semibold">שירותים</h2>
          {amenitiesByCategory.map((group) => (
            <div key={group.category} className="mt-3">
              <h3 className="text-sm text-black/60">
                {he.amenityCategories[
                  group.category as keyof typeof he.amenityCategories
                ] ?? group.category}
              </h3>
              <ul className="mt-1 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item.amenity_key}
                    className="rounded-md border border-black/15 px-2 py-1 text-sm"
                  >
                    {he.amenities[item.amenity_key as keyof typeof he.amenities] ??
                      item.amenity_key}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {property.property_photos.length > 0 && (
        <section className="mt-8">
          <h2 className="font-semibold">תמונות/וידאו</h2>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[...property.property_photos]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((photo) =>
                photo.media_type === "video" ? (
                  <video
                    key={photo.url}
                    src={photo.url}
                    controls
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.url}
                    src={photo.url}
                    alt=""
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ),
              )}
          </div>
        </section>
      )}
    </div>
  );
}
