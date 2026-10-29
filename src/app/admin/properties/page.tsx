import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getPendingEditPropertyIds } from "@/lib/properties";
import {
  expiryInputValue,
  expiryPill,
  formatAdminDate,
  needsRenewal,
  subscriptionState,
  type SubscriptionState,
} from "@/lib/admin-subscription";
import { approveProperty, deleteProperty, rejectProperty } from "../actions";
import { geocodeLegacyProperties, geocodeRegions } from "../geocode-actions";
import AdminHeader from "@/components/admin/AdminHeader";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";
import ListingExpiryEditor from "@/components/admin/ListingExpiryEditor";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "ממתין לאישור",
  approved: "מאושר",
  rejected: "נדחה",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending_approval: "bg-amber-50 text-amber-800 ring-amber-600/25",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
};

const FILTERS = [
  { key: "all", label: "הכל" },
  { key: "pending_approval", label: "ממתינות לאישור" },
  { key: "edits", label: "עריכות ממתינות" },
  { key: "live", label: "מוצגות באתר" },
  { key: "renewal", label: "פג / עומד לפוג" },
  { key: "rejected", label: "נדחו" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

type AdminPropertyRow = {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
  price_per_night: number;
  approval_status: string;
  created_at: string;
  bedrooms: number;
  max_guests: number | null;
  phone_country_code: string;
  phone_number: string;
  listing_expires_at: string | null;
  owners: { full_name: string | null } | null;
  regions: { name_he: string } | null;
  property_photos: { url: string; sort_order: number; media_type: string }[];
};

function defaultExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 365);
  return d.toISOString().slice(0, 10);
}

function thumbnailUrl(photos: AdminPropertyRow["property_photos"]): string | null {
  const first = [...photos]
    .filter((p) => p.media_type === "image")
    .sort((a, b) => a.sort_order - b.sort_order)[0];
  return first
    ? first.url.replace("/upload/", "/upload/f_auto,q_auto,c_fill,w_240,h_180/")
    : null;
}

/**
 * "live" = approved and still within its listing period, i.e. what
 * visitors actually see. "renewal" = approved but expired (already
 * hidden from the site) or expiring within EXPIRING_SOON_DAYS.
 */
function matchesFilter(
  {
    property,
    subscription,
    hasPendingEdit,
  }: {
    property: AdminPropertyRow;
    subscription: SubscriptionState;
    hasPendingEdit: boolean;
  },
  filter: FilterKey,
): boolean {
  const approved = property.approval_status === "approved";
  switch (filter) {
    case "all":
      return true;
    case "edits":
      return hasPendingEdit;
    case "live":
      return approved && subscription.kind !== "expired";
    case "renewal":
      return approved && needsRenewal(subscription);
    default:
      return property.approval_status === filter;
  }
}

function filterHref(filter: FilterKey, q: string): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/properties?${query}` : "/admin/properties";
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { status, q: rawQuery } = await searchParams;
  const activeFilter: FilterKey =
    FILTERS.find((f) => f.key === status)?.key ?? "all";
  const q = rawQuery?.trim() ?? "";

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `id, address, lat, lng, price_per_night, approval_status, created_at, bedrooms,
       max_guests, phone_country_code, phone_number,
       listing_expires_at, owners(full_name),
       regions(name_he),
       property_photos(url, sort_order, media_type)`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load properties: ${error.message}`);
  }

  const pendingEditIds = await getPendingEditPropertyIds(supabase);

  const now = new Date();
  const rows = (data as unknown as AdminPropertyRow[]).map((property) => ({
    property,
    subscription: subscriptionState(property.listing_expires_at, now),
    hasPendingEdit: pendingEditIds.has(property.id),
  }));

  const counts: Record<FilterKey, number> = {
    all: rows.length,
    pending_approval: 0,
    live: 0,
    renewal: 0,
    rejected: 0,
    edits: 0,
  };
  for (const row of rows) {
    for (const filter of FILTERS) {
      if (filter.key !== "all" && matchesFilter(row, filter.key)) {
        counts[filter.key] += 1;
      }
    }
  }

  const needle = q.toLowerCase();
  const visible = rows
    .filter((row) => matchesFilter(row, activeFilter))
    .filter(({ property }) => {
      if (!needle) return true;
      return [
        property.address,
        property.owners?.full_name ?? "",
        `${property.phone_country_code}${property.phone_number}`,
        property.phone_number,
      ].some((field) => field.toLowerCase().includes(needle));
    })
    // Pending listings and pending owner edits are the admin's to-do
    // list - keep them on top.
    .sort((a, b) => {
      const needsAction = ({ property }: (typeof rows)[number]) =>
        property.approval_status === "pending_approval" ||
        pendingEditIds.has(property.id);
      return Number(needsAction(b)) - Number(needsAction(a));
    });

  const stats = [
    { label: "סה״כ דירות", value: counts.all, filter: "all" as const },
    {
      label: "ממתינות לאישור",
      value: counts.pending_approval,
      filter: "pending_approval" as const,
      highlight: counts.pending_approval > 0,
    },
    { label: "מוצגות באתר", value: counts.live, filter: "live" as const },
    {
      label: "מנוי פג / עומד לפוג",
      value: counts.renewal,
      filter: "renewal" as const,
      highlight: counts.renewal > 0,
    },
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      <AdminHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-serif-brand text-2xl font-semibold text-ink sm:text-3xl">
          הדירות באתר
        </h1>
        <p className="mt-1 text-sm text-black/60">
          כל הדירות שפורסמו, הסטטוס שלהן ועד מתי כל דירה מוצגת באתר.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.filter}
              href={filterHref(stat.filter, q)}
              className={`rounded-xl border bg-white p-4 transition-colors hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                stat.highlight ? "border-amber-400/70" : "border-black/10"
              }`}
            >
              <dt className="text-sm text-black/60">{stat.label}</dt>
              <dd className="mt-1 text-3xl font-semibold tabular-nums text-ink">
                {stat.value}
              </dd>
            </Link>
          ))}
        </dl>

        {counts.edits > 0 && activeFilter !== "edits" && (
          <Link
            href={filterHref("edits", q)}
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-400/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span>
              {counts.edits === 1
                ? "בעל דירה ערך דירה מאושרת, והעריכה ממתינה לאישור שלך."
                : `${counts.edits} עריכות של בעלי דירות ממתינות לאישור שלך.`}
            </span>
            <span className="shrink-0 font-medium underline underline-offset-2">
              הצג
            </span>
          </Link>
        )}

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="סינון לפי סטטוס" className="-mx-4 overflow-x-auto px-4">
            <ul className="flex w-max gap-1 rounded-lg bg-black/5 p-1">
              {FILTERS.map((filter) => {
                const isActive = filter.key === activeFilter;
                return (
                  <li key={filter.key}>
                    <Link
                      href={filterHref(filter.key, q)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                        isActive
                          ? "bg-white font-medium text-ink shadow-sm"
                          : "text-black/65 hover:text-ink"
                      }`}
                    >
                      {filter.label}
                      <span className="tabular-nums text-black/45">
                        {counts[filter.key]}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <form role="search" action="/admin/properties" className="flex gap-2">
            {activeFilter !== "all" && (
              <input type="hidden" name="status" value={activeFilter} />
            )}
            <label htmlFor="admin-search" className="sr-only">
              חיפוש לפי כתובת, בעלים או טלפון
            </label>
            <input
              id="admin-search"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="חיפוש: כתובת, בעלים, טלפון"
              className="min-h-10 w-full rounded-md border border-black/15 bg-white px-3 text-base sm:w-72 sm:text-sm"
            />
            <button
              type="submit"
              className="min-h-10 cursor-pointer rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              חיפוש
            </button>
          </form>
        </div>

        {visible.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-black/15 bg-white px-6 py-12 text-center">
            <p className="font-medium text-ink">
              {rows.length === 0
                ? "אין עדיין דירות במערכת."
                : "אין דירות שמתאימות לסינון הזה."}
            </p>
            {(q || activeFilter !== "all") && rows.length > 0 && (
              <Link
                href="/admin/properties"
                className="mt-2 inline-block text-sm text-brand underline underline-offset-2"
              >
                הצג את כל הדירות
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {visible.map(({ property, subscription }) => (
              <PropertyRow
                key={property.id}
                property={property}
                subscription={subscription}
                hasPendingEdit={pendingEditIds.has(property.id)}
              />
            ))}
          </ul>
        )}

        <details className="mt-10 rounded-xl border border-black/10 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-medium text-black/70">
            כלים חד-פעמיים (מילוי קואורדינטות Mapbox)
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={geocodeRegions}>
              <PendingSubmitButton
                pendingLabel="ממלא…"
                className="min-h-10 cursor-pointer rounded-md border border-black/15 px-3 hover:bg-black/5 disabled:cursor-wait disabled:opacity-60"
              >
                מלא קואורדינטות לאזורים
              </PendingSubmitButton>
            </form>
            <form action={geocodeLegacyProperties}>
              <PendingSubmitButton
                pendingLabel="ממלא…"
                className="min-h-10 cursor-pointer rounded-md border border-black/15 px-3 hover:bg-black/5 disabled:cursor-wait disabled:opacity-60"
              >
                מלא קואורדינטות לדירות ישנות
              </PendingSubmitButton>
            </form>
          </div>
        </details>
      </main>
    </div>
  );
}

function PropertyRow({
  property,
  subscription,
  hasPendingEdit,
}: {
  property: AdminPropertyRow;
  subscription: SubscriptionState;
  hasPendingEdit: boolean;
}) {
  const thumb = thumbnailUrl(property.property_photos);
  const detailHref = `/admin/properties/${property.id}`;
  const photoCount = property.property_photos.length;
  const isApproved = property.approval_status === "approved";
  const isExpired = isApproved && subscription.kind === "expired";
  const pill = expiryPill(subscription);

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
        <Link
          href={detailHref}
          tabIndex={-1}
          aria-hidden="true"
          className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg bg-placeholder sm:w-32"
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-black/50">
              אין תמונה
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isExpired ? (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                פג תוקף · לא מוצג באתר
              </span>
            ) : (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  STATUS_BADGE_CLASSES[property.approval_status] ??
                  "bg-black/5 text-black/70 ring-black/10"
                }`}
              >
                {STATUS_LABELS[property.approval_status] ?? property.approval_status}
              </span>
            )}
            {hasPendingEdit && (
              <Link
                href={`${detailHref}#pending-edit`}
                className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-inset ring-amber-600/30 hover:bg-amber-200"
              >
                עריכה ממתינה לאישור
              </Link>
            )}
            {/* No lat/lng = hidden from the search map until the
                geocodeLegacyProperties backfill (tools below) runs. */}
            {(property.lat == null || property.lng == null) && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                אין מיקום במפה
              </span>
            )}
          </div>

          <Link
            href={detailHref}
            className="mt-1.5 block break-words text-base font-semibold text-ink hover:underline hover:underline-offset-2 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <bdi>{property.address}</bdi>
          </Link>

          <p className="mt-0.5 text-sm text-black/65">
            {[
              property.regions?.name_he,
              `$${property.price_per_night} ללילה`,
              `${property.bedrooms} חדרי שינה`,
              property.max_guests ? `עד ${property.max_guests} אורחים` : null,
              `${photoCount} ${photoCount === 1 ? "קובץ מדיה" : "קבצי מדיה"}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="break-words text-black/80">
              {property.owners?.full_name ? (
                <bdi>{property.owners.full_name}</bdi>
              ) : (
                "בעלים ללא שם"
              )}
            </span>
            <a
              href={`tel:${property.phone_country_code}${property.phone_number}`}
              className="inline-flex items-center gap-1 text-black/70 hover:text-ink"
              dir="ltr"
            >
              <PhoneIcon />
              {property.phone_country_code} {property.phone_number}
            </a>
            <a
              href={buildWhatsAppLink({
                countryCode: property.phone_country_code,
                phoneNumber: property.phone_number,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent-whatsapp hover:underline hover:underline-offset-2"
            >
              <ChatIcon />
              וואטסאפ
            </a>
            <span className="text-black/50">
              נוסף {formatAdminDate(new Date(property.created_at))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-black/5 pt-3 sm:w-auto sm:shrink-0 sm:flex-col sm:items-stretch sm:border-t-0 sm:border-s sm:ps-4 sm:pt-0">
        {isApproved ? (
          <ListingExpiryEditor
            propertyId={property.id}
            label={pill.label}
            tone={pill.tone}
            currentDate={expiryInputValue(subscription)}
          />
        ) : (
          <form
            action={approveProperty.bind(null, property.id)}
            className="flex items-center gap-1.5"
          >
            <label className="sr-only" htmlFor={`expires-${property.id}`}>
              מנוי בתוקף עד
            </label>
            <input
              id={`expires-${property.id}`}
              type="date"
              name="expiresAt"
              defaultValue={defaultExpiryDate()}
              required
              title="מנוי בתוקף עד"
              className="min-h-10 rounded-md border border-black/15 px-2 text-sm"
            />
            <PendingSubmitButton
              pendingLabel="מאשר…"
              className="min-h-10 cursor-pointer rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              אשר
            </PendingSubmitButton>
          </form>
        )}
        <div className="flex gap-2">
          <Link
            href={`${detailHref}/edit`}
            className="flex min-h-10 flex-1 items-center justify-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5"
          >
            ערוך
          </Link>
          {property.approval_status === "pending_approval" && (
            <form action={rejectProperty.bind(null, property.id)} className="flex-1">
              <PendingSubmitButton
                pendingLabel="דוחה…"
                className="min-h-10 w-full cursor-pointer rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 disabled:cursor-wait disabled:opacity-60"
              >
                דחה
              </PendingSubmitButton>
            </form>
          )}
          <form action={deleteProperty.bind(null, property.id)} className="flex-1">
            <PendingSubmitButton
              pendingLabel="מוחק…"
              confirmMessage={`למחוק לצמיתות את הדירה ב-${property.address}? לא ניתן לבטל.`}
              className="min-h-10 w-full cursor-pointer rounded-md border border-red-600/40 px-3 text-sm text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
            >
              מחק
            </PendingSubmitButton>
          </form>
        </div>
      </div>
    </li>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
