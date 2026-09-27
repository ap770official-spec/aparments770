import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureOwnerRow } from "@/lib/owners";
import {
  getOwnerProperties,
  mainMedia,
  type PropertySummary,
} from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import PropertyActionsMenu from "@/components/PropertyActionsMenu";
import ReactivateListingButton from "@/components/ReactivateListingButton";
import AvailabilityModeSelect from "@/components/AvailabilityModeSelect";

export const dynamic = "force-dynamic";

type ListingStatus = "live" | "pending_approval" | "paused" | "rejected";

function listingStatus(property: PropertySummary): ListingStatus {
  if (property.approval_status === "pending_approval") return "pending_approval";
  if (property.approval_status === "rejected") return "rejected";
  return property.availability_mode === "fully_locked" ? "paused" : "live";
}

const STATUS_PILL_CLASSES: Record<ListingStatus, string> = {
  live: "bg-status-live-bg text-status-live-text",
  pending_approval: "bg-status-pending-bg text-status-pending-text",
  paused: "bg-status-paused-bg text-status-paused-text",
  rejected: "bg-status-pending-bg text-danger",
};

const PRIMARY_ACTION_HREF: Record<
  Exclude<ListingStatus, "paused">,
  (id: string) => string
> = {
  live: (id) => `/property/${id}`,
  pending_approval: (id) => `/owner/properties/new?duplicate=${id}`,
  rejected: (id) => `/owner/properties/new?duplicate=${id}`,
};

export default async function OwnerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/owner/login", locale });
  }

  await ensureOwnerRow(supabase, user!.id);
  const properties = await getOwnerProperties(supabase, user!.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-start justify-between gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-serif-brand text-2xl font-semibold sm:text-[30px]">
            {t("title")}
          </h1>
          <p className="text-sm text-text-secondary">{t("subtitle")}</p>
        </div>
        <Link
          href="/owner/properties/new"
          className="hidden shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground sm:flex"
        >
          {t("addProperty")}
        </Link>
      </div>

      <div className="mt-4">
        <Link
          href="/owner/properties/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground sm:hidden"
        >
          {t("addProperty")}
        </Link>
      </div>

      {properties.length === 0 ? (
        <p className="mt-8 text-text-secondary">{t("noProperties")}</p>
      ) : (
        <ul className="mt-7 flex flex-col gap-4">
          {properties.map((property) => {
            const media = mainMedia(property.property_photos);
            const status = listingStatus(property);
            const propertyPath = `/property/${property.id}`;
            const meta = t("roomsGuestsPrice", {
              rooms: property.bedrooms,
              guests: property.max_guests ?? property.beds,
              price: property.price_per_night,
            });

            const thumbnail = media ? (
              media.media_type === "video" ? (
                <video
                  src={optimizedCloudinaryUrl(media.url)}
                  className="h-full w-full object-cover"
                  muted
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={optimizedCloudinaryUrl(media.url)}
                  alt={property.address}
                  className="h-full w-full object-cover"
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-placeholder text-[10px] text-placeholder-text">
                📷
              </div>
            );

            const editLink = (
              <Link
                href={`/owner/properties/new?duplicate=${property.id}`}
                className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-center text-sm font-semibold"
              >
                {t("editDetails")}
              </Link>
            );

            const primaryAction =
              status === "paused" ? (
                <div className="flex-1">
                  <ReactivateListingButton propertyId={property.id} />
                </div>
              ) : (
                <Link
                  href={PRIMARY_ACTION_HREF[status](property.id)}
                  className="flex-1 rounded-lg bg-brand px-3 py-2 text-center text-sm font-bold text-brand-foreground"
                >
                  {t(`action.${status}`)}
                </Link>
              );

            const availabilitySelect = (
              <AvailabilityModeSelect
                propertyId={property.id}
                initialMode={property.availability_mode}
              />
            );

            return (
              <li
                key={property.id}
                className="flex flex-col gap-3 rounded-2xl border border-border-soft p-4 sm:flex-row sm:items-center sm:gap-5"
              >
                {/* Mobile layout */}
                <div className="flex gap-3 sm:hidden">
                  <div className="h-[68px] w-[84px] shrink-0 overflow-hidden rounded-lg">
                    {thumbnail}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_PILL_CLASSES[status]}`}
                    >
                      {t(`status.${status}`)}
                    </span>
                    <h3 className="truncate text-[14.5px] font-bold">
                      {property.address}
                    </h3>
                    <span className="text-xs text-text-secondary">{meta}</span>
                  </div>
                  <PropertyActionsMenu
                    propertyId={property.id}
                    propertyPath={propertyPath}
                    shareTitle={property.address}
                  />
                </div>
                <p className="text-[11.5px] leading-relaxed text-text-faint sm:hidden">
                  {t(`note.${status}`)}
                </p>
                <div className="sm:hidden">{availabilitySelect}</div>
                <div className="flex gap-2 sm:hidden">
                  {editLink}
                  {primaryAction}
                </div>

                {/* Desktop layout */}
                <div className="hidden h-[100px] w-[140px] shrink-0 overflow-hidden rounded-lg sm:block">
                  {thumbnail}
                </div>
                <div className="hidden min-w-0 flex-1 flex-col gap-1.5 sm:flex">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[17px] font-bold">{property.address}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_PILL_CLASSES[status]}`}
                    >
                      {t(`status.${status}`)}
                    </span>
                  </div>
                  <span className="text-sm text-text-secondary">{meta}</span>
                  <span className="text-xs text-text-faint">
                    {t(`note.${status}`)}
                  </span>
                  {availabilitySelect}
                </div>
                <div className="hidden shrink-0 sm:block">
                  <PropertyActionsMenu
                    propertyId={property.id}
                    propertyPath={propertyPath}
                    shareTitle={property.address}
                  />
                </div>
                <div className="hidden w-[150px] shrink-0 flex-col gap-2 sm:flex">
                  {editLink}
                  {primaryAction}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
