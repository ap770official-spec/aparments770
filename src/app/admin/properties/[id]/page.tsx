import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  type AdminPropertyDetail,
  getAdminPropertyById,
  getPendingPropertyEdit,
} from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  expiryInputValue,
  expiryPill,
  formatAdminDate,
  subscriptionState,
} from "@/lib/admin-subscription";
import { approveProperty, deleteProperty, rejectProperty } from "../../actions";
import AdminHeader from "@/components/admin/AdminHeader";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";
import ListingExpiryEditor from "@/components/admin/ListingExpiryEditor";
import PendingEditSection from "./PendingEditSection";
import he from "../../../../../messages/he.json";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "ממתין לאישור",
  approved: "מאושר ומפורסם",
  rejected: "נדחה",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending_approval: "bg-amber-50 text-amber-800 ring-amber-600/25",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: he.propertyForm.propertyTypeApartment,
  house: he.propertyForm.propertyTypeHouse,
  basement: he.propertyForm.propertyTypeBasement,
};

const AMENITY_CATEGORY_ORDER = [
  "kitchen",
  "climate",
  "bathroom",
  "safety",
  "family",
  "outdoor",
  "shabbat_kosher",
  "proximity",
] as const;

const badgeBase =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";

function defaultExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 365);
  return d.toISOString().slice(0, 10);
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      {title && <h2 className="mb-4 text-base font-bold text-ink">{title}</h2>}
      {children}
    </section>
  );
}

export default async function AdminPropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; geo?: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const { saved, geo } = await searchParams;
  const supabase = createAdminSupabaseClient();
  const property = await getAdminPropertyById(supabase, id);

  if (!property) {
    notFound();
  }

  const [pendingEdit, { data: regions }] = await Promise.all([
    getPendingPropertyEdit(supabase, property.id),
    supabase.from("regions").select("id, name_he"),
  ]);
  const regionNames = Object.fromEntries(
    (regions ?? []).map((r) => [r.id as string, r.name_he as string]),
  );

  const media = [...property.property_photos].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const amenitiesByCategory = AMENITY_CATEGORY_ORDER.map((category) => ({
    category,
    items: property.property_amenities.filter((a) => a.category === category),
  })).filter((group) => group.items.length > 0);

  const subscription = subscriptionState(property.listing_expires_at);
  const isApproved = property.approval_status === "approved";
  const isExpired = isApproved && subscription.kind === "expired";
  const pill = expiryPill(subscription);
  const hasLocation = property.lat != null && property.lng != null;
  const phoneHref = `tel:${property.phone_country_code}${property.phone_number}`;
  const whatsappHref = buildWhatsAppLink({
    countryCode: property.phone_country_code,
    phoneNumber: property.phone_number,
  });
  const editHref = `/admin/properties/${property.id}/edit`;

  const facts = [
    { label: "מחיר ללילה", value: `$${property.price_per_night}` },
    { label: he.property.bedrooms, value: property.bedrooms },
    { label: he.property.beds, value: property.beds },
    { label: he.property.toilets, value: property.toilets },
    { label: he.property.bathtubs, value: property.bathtubs },
    { label: he.property.maxGuests, value: property.max_guests ?? "—" },
    { label: he.property.minNights, value: property.min_nights ?? "—" },
    { label: he.property.checkin, value: property.checkin_time?.slice(0, 5) ?? "—" },
    { label: he.property.checkout, value: property.checkout_time?.slice(0, 5) ?? "—" },
  ];


  return (
    <div className="min-h-dvh bg-canvas">
      <AdminHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:pt-6">
        <Link
          href="/admin/properties"
          className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          → חזרה לכל הדירות
        </Link>

        {saved && (
          <div
            role="status"
            className="mt-3 rounded-xl border border-emerald-600/25 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
          >
            השינויים נשמרו.
            {geo === "0" &&
              " שים לב: הכתובת החדשה לא נמצאה במפה, ולכן נשמר המיקום הקודם."}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {isExpired ? (
                <span className={`${badgeBase} bg-red-50 text-red-700 ring-red-600/20`}>
                  פג תוקף · לא מוצג באתר
                </span>
              ) : (
                <span
                  className={`${badgeBase} ${
                    STATUS_BADGE_CLASSES[property.approval_status] ??
                    "bg-black/5 text-ink-soft ring-black/10"
                  }`}
                >
                  {STATUS_LABELS[property.approval_status] ?? property.approval_status}
                </span>
              )}
              {!hasLocation && (
                <span className={`${badgeBase} bg-red-50 text-red-700 ring-red-600/20`}>
                  אין מיקום במפה
                </span>
              )}
            </div>
            <h1 className="mt-2 break-words font-serif-brand text-2xl font-bold leading-tight text-ink sm:text-[32px]">
              <bdi>{property.address}</bdi>
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              {[
                property.regions?.name_he,
                PROPERTY_TYPE_LABELS[property.property_type],
                `נוסף ${formatAdminDate(new Date(property.created_at))}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={editHref}
              className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <PencilIcon />
              עריכת הדירה
            </Link>
            {isApproved && !isExpired && (
              <a
                href={`/he/property/${property.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center rounded-lg border border-ink px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
              >
                צפייה באתר
              </a>
            )}
          </div>
        </div>

        {pendingEdit && (
          <PendingEditSection
            property={property}
            edit={pendingEdit}
            regionNames={regionNames}
          />
        )}

        <Gallery media={media} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8">
          <div className="flex min-w-0 flex-col gap-6">
            <Card title="פרטי הדירה">
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                {facts.map((fact, index) => (
                  <div
                    key={fact.label}
                    className={`flex flex-col gap-0.5 bg-white px-3.5 py-3 ${
                      index === facts.length - 1 && facts.length % 2 === 1
                        ? "col-span-2 sm:col-span-1"
                        : ""
                    }`}
                  >
                    <dt className="text-xs font-semibold text-ink-muted">{fact.label}</dt>
                    <dd className="text-[15px] font-semibold tabular-nums text-ink">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            {(property.description_he || property.description_en) && (
              <Card title={he.property.aboutTitle}>
                <div className="flex flex-col gap-4">
                  {property.description_he && (
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink-soft">
                      {property.description_he}
                    </p>
                  )}
                  {property.description_en && (
                    <p
                      className="whitespace-pre-wrap border-t border-line pt-4 text-[15px] leading-7 text-ink-soft"
                      dir="ltr"
                    >
                      {property.description_en}
                    </p>
                  )}
                </div>
              </Card>
            )}

            <Card title={he.property.amenitiesTitle}>
              {amenitiesByCategory.length === 0 ? (
                <p className="text-sm text-ink-muted">לא סומנו שירותים.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {amenitiesByCategory.map((group) => (
                    <div key={group.category}>
                      <h3 className="text-sm font-semibold text-ink-muted">
                        {he.amenityCategories[group.category]}
                      </h3>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <li
                            key={item.amenity_key}
                            className="rounded-full border border-line px-3.5 py-1.5 text-[13.5px] font-semibold text-ink"
                          >
                            {he.amenities[item.amenity_key as keyof typeof he.amenities] ??
                              item.amenity_key}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <section className="rounded-2xl border border-red-600/20 bg-white p-5">
              <h2 className="text-base font-bold text-ink">מחיקת הדירה</h2>
              <p className="mt-1 text-sm text-ink-soft">
                מוחק לצמיתות את הדירה, השירותים והתמונות שלה. לא ניתן לבטל.
              </p>
              <form action={deleteProperty.bind(null, property.id)} className="mt-4">
                <PendingSubmitButton
                  pendingLabel="מוחק…"
                  confirmMessage={`למחוק לצמיתות את הדירה ב-${property.address}? לא ניתן לבטל.`}
                  className="min-h-11 w-full cursor-pointer rounded-lg border border-red-600/40 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                >
                  מחק דירה
                </PendingSubmitButton>
              </form>
            </section>
          </div>

          <aside className="order-first flex flex-col gap-6 lg:order-none">
            <Card title="סטטוס ומנוי">
              <dl className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-ink-muted">סטטוס</dt>
                <dd className={`font-semibold ${isExpired ? "text-red-700" : "text-ink"}`}>
                  {isExpired
                    ? "פג תוקף · לא מוצג באתר"
                    : (STATUS_LABELS[property.approval_status] ?? property.approval_status)}
                </dd>
              </dl>

              {isApproved && (
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-ink">מוצג באתר עד</p>
                  <ListingExpiryEditor
                    propertyId={property.id}
                    label={pill.label}
                    tone={pill.tone}
                    currentDate={expiryInputValue(subscription)}
                    fullWidth
                  />
                  <p className="text-xs text-ink-muted">
                    לחיצה מאפשרת לשנות את התאריך לדירה הזו בלבד. אחרי התאריך הדירה יורדת מהאתר אוטומטית.
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2 border-t border-line pt-5">
                {!isApproved && (
                  <form
                    action={approveProperty.bind(null, property.id)}
                    className="flex flex-col gap-2"
                  >
                    <label htmlFor="expiresAt" className="text-sm font-semibold text-ink">
                      אישור והצגה באתר עד
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="expiresAt"
                        type="date"
                        name="expiresAt"
                        defaultValue={defaultExpiryDate()}
                        required
                        className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-sm"
                      />
                      <PendingSubmitButton
                        pendingLabel="מאשר…"
                        className="min-h-11 cursor-pointer rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                      >
                        אשר
                      </PendingSubmitButton>
                    </div>
                    <p className="text-xs text-ink-muted">
                      בעל הדירה יקבל מייל עם אישור PDF.
                    </p>
                  </form>
                )}
                {property.approval_status !== "rejected" && (
                  <form action={rejectProperty.bind(null, property.id)}>
                    <PendingSubmitButton
                      pendingLabel="דוחה…"
                      className="min-h-11 w-full cursor-pointer rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-black/[0.03] disabled:cursor-wait disabled:opacity-60"
                    >
                      {property.approval_status === "approved"
                        ? "הסר מהאתר (דחה)"
                        : "דחה"}
                    </PendingSubmitButton>
                  </form>
                )}
              </div>
            </Card>

            <Card title="בעל הדירה">
              <p className="break-words text-[15px] font-semibold text-ink">
                {property.owners?.full_name ? (
                  <bdi>{property.owners.full_name}</bdi>
                ) : (
                  "ללא שם"
                )}
              </p>
              <p className="mt-0.5 text-sm text-ink-soft" dir="ltr">
                <span className="inline-block">
                  {property.phone_country_code} {property.phone_number}
                </span>
              </p>
              <OwnerDetails owner={property.owners} listingPhone={`${property.phone_country_code}${property.phone_number}`} />
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-accent-whatsapp px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <ChatIcon />
                  פתח וואטסאפ
                </a>
                <a
                  href={phoneHref}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-ink px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  <PhoneIcon />
                  חייג
                </a>
              </div>
            </Card>

            <Card title={he.property.locationTitle}>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">מיקום במפה</dt>
                  <dd className={`font-semibold ${hasLocation ? "text-ink" : "text-red-700"}`}>
                    {hasLocation ? "מסומן" : "חסר — לא מופיע במפה"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">הליכה ל-770</dt>
                  <dd className="font-semibold text-ink">
                    {property.walking_minutes_to_landmark != null
                      ? `${property.walking_minutes_to_landmark} דק׳`
                      : "—"}
                  </dd>
                </div>
                {property.address_notes && (
                  <div className="border-t border-line pt-3">
                    <dt className="text-ink-muted">הערות לאיתור</dt>
                    <dd className="mt-0.5 text-ink" dir="auto">
                      {property.address_notes}
                    </dd>
                  </div>
                )}
              </dl>
              {hasLocation && (
                <a
                  href={`https://www.google.com/maps?q=${property.lat},${property.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-brand underline underline-offset-2"
                >
                  פתח ב-Google Maps
                </a>
              )}
            </Card>

          </aside>
        </div>
      </main>
    </div>
  );
}

function Gallery({
  media,
}: {
  media: { url: string; media_type: "image" | "video" }[];
}) {
  if (media.length === 0) {
    return (
      <div className="mt-5 flex h-40 items-center justify-center rounded-2xl border border-dashed border-line bg-white text-sm text-ink-muted">
        לא הועלו תמונות לדירה הזו
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {media.map((item, index) => (
          <div
            key={item.url}
            className={`relative overflow-hidden rounded-xl bg-placeholder ${
              index === 0
                ? "col-span-2 aspect-[4/3] sm:row-span-2"
                : "aspect-[4/3]"
            }`}
          >
            {item.media_type === "video" ? (
              <video
                src={item.url}
                controls
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optimizedCloudinaryUrl(item.url)}
                  alt={`תמונה ${index + 1}`}
                  loading={index < 5 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
              </a>
            )}
            {index === 0 && (
              <span className="pointer-events-none absolute start-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
                תמונה ראשית
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        {media.length} {media.length === 1 ? "קובץ מדיה" : "קבצי מדיה"} · לחיצה על תמונה פותחת אותה בגודל מלא
      </p>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

/**
 * What the owner filled in on the one-time details screen. The listing
 * phone above is per property; the owner's own phone is only shown
 * here when it differs.
 */
function OwnerDetails({
  owner,
  listingPhone,
}: {
  owner: AdminPropertyDetail["owners"];
  listingPhone: string;
}) {
  if (!owner?.terms_accepted_at) {
    return (
      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-600/25">
        בעל הדירה עדיין לא השלים את הפרטים האישיים שלו.
      </p>
    );
  }

  const ownerPhone =
    owner.phone_country_code && owner.phone_number
      ? `${owner.phone_country_code}${owner.phone_number}`
      : null;
  const source = owner.referral_source
    ? owner.referral_source === "other" && owner.referral_other
      ? `${he.ownerProfile.sources.other}: ${owner.referral_other}`
      : he.ownerProfile.sources[
          owner.referral_source as keyof typeof he.ownerProfile.sources
        ]
    : "—";

  const rows = [
    ownerPhone && ownerPhone !== listingPhone
      ? {
          label: "טלפון אישי",
          value: (
            <span dir="ltr" className="inline-block">
              {owner.phone_country_code} {owner.phone_number}
            </span>
          ),
        }
      : null,
    {
      label: "קשר לדירה",
      value: owner.owner_role
        ? he.ownerProfile.roles[
            owner.owner_role as keyof typeof he.ownerProfile.roles
          ]
        : "—",
    },
    { label: "איך שמע עלינו", value: <bdi>{source}</bdi> },
    {
      label: "אישר תנאי שימוש",
      value: formatAdminDate(new Date(owner.terms_accepted_at)),
    },
  ].filter((row) => row !== null);

  return (
    <dl className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{row.label}</dt>
          <dd className="text-end font-semibold break-words text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
