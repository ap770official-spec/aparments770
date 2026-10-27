import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureOwnerRow, getOwnerSubscription } from "@/lib/owners";
import { subscriptionState } from "@/lib/admin-subscription";
import {
  getOwnerProperties,
  getPendingEditPropertyIds,
  mainMedia,
} from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import LogoutButton from "@/components/LogoutButton";
import AvailabilityModeSelect from "@/components/AvailabilityModeSelect";
import EditSentDialog from "@/components/EditSentDialog";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending_approval: "bg-[#FDF3E1] text-[#8A5A12] ring-[#F0D9AE]",
  approved: "bg-[#E8F3EC] text-[#256240] ring-[#C5E0CF]",
  rejected: "bg-[#FBEAEA] text-[#9B2C2C] ring-[#F1CACA]",
};

const LISTING_PERIOD_TONES = {
  active: "text-[#8A8073]",
  expiring: "font-semibold text-[#8A5A12]",
  expired: "font-semibold text-[#9B2C2C]",
  frozen: "font-semibold text-[#5C5349]",
};

function StatusIcon({ status }: { status: string }) {
  const common = {
    width: 12,
    height: 12,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (status === "approved") {
    return (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (status === "rejected") {
    return (
      <svg {...common}>
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default async function OwnerDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { locale } = await params;
  const { edit } = await searchParams;
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
  const [properties, pendingEditIds, ownerSubscription] = await Promise.all([
    getOwnerProperties(supabase, user!.id),
    getPendingEditPropertyIds(supabase, user!.id),
    getOwnerSubscription(supabase, user!.id),
  ]);

  // One subscription covers all of the owner's listings, so every
  // approved listing shows the same end date.
  const subscription = subscriptionState(ownerSubscription);
  const formatDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const listingPeriod =
    subscription.kind === "none"
      ? null
      : subscription.kind === "frozen"
        ? { tone: "frozen" as const, text: t("listingFrozen") }
        : subscription.kind === "expired"
          ? {
              tone: "expired" as const,
              text: t("listingExpired", {
                date: formatDate.format(subscription.expiresAt),
              }),
            }
          : subscription.kind === "expiring"
            ? {
                tone: "expiring" as const,
                text: t("listedUntilSoon", {
                  date: formatDate.format(subscription.expiresAt),
                  days: subscription.daysLeft,
                }),
              }
            : {
                tone: "active" as const,
                text: t("listedUntil", {
                  date: formatDate.format(subscription.expiresAt),
                }),
              };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {edit === "sent" && <EditSentDialog />}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5DED3] pb-6">
        <div className="min-w-0">
          <h1 className="font-serif-brand text-3xl font-semibold text-ink">
            {t("title")}
          </h1>
          <p className="mt-1.5 truncate text-sm text-[#5C5349]">
            {t("loggedInAs", { email: user!.email ?? "" })}
          </p>
        </div>
        <LogoutButton />
      </div>

      <section className="mt-8" aria-labelledby="my-properties-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="my-properties-heading"
            className="flex items-center gap-2 text-xl font-bold text-ink"
          >
            {t("myProperties")}
            {properties.length > 0 && (
              <span className="rounded-full bg-[#F3EEE6] px-2.5 py-0.5 text-sm font-semibold text-[#5C5349] tabular-nums">
                {properties.length}
              </span>
            )}
          </h2>
          {properties.length > 0 && (
            <Link
              href="/owner/properties/new"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-black active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("addProperty")}
            </Link>
          )}
        </div>

        {properties.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-[14px] border border-dashed border-[#D8CFC0] bg-[#FAF7F2] px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand ring-1 ring-[#E5DED3]">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
                <path d="M10 21v-6h4v6" />
              </svg>
            </div>
            <p className="mt-4 max-w-xs text-[15px] text-[#5C5349]">
              {t("noProperties")}
            </p>
            <Link
              href="/owner/properties/new"
              className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-ink px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-black active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("addProperty")}
            </Link>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {properties.map((property) => {
              const media = mainMedia(property.property_photos);
              const status = property.approval_status;
              return (
                <li
                  key={property.id}
                  className="flex flex-col overflow-hidden rounded-[14px] border border-[#E5DED3] bg-white sm:flex-row"
                >
                  <div className="relative aspect-[16/10] w-full shrink-0 bg-placeholder sm:aspect-auto sm:min-h-40 sm:w-60">
                    {media ? (
                      media.media_type === "video" ? (
                        <video
                          src={optimizedCloudinaryUrl(media.url)}
                          className="absolute inset-0 h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={optimizedCloudinaryUrl(media.url)}
                          alt={property.address}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#A89E90]">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <circle cx="9" cy="10" r="2" />
                          <path d="m21 16-5-5L5 20" />
                        </svg>
                      </div>
                    )}
                    <span
                      className={`absolute start-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_STYLES[status] ?? STATUS_STYLES.pending_approval}`}
                    >
                      <StatusIcon status={status} />
                      {t(`status.${status}`)}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6 md:p-5">
                    <div className="min-w-0 flex-1">
                      <h3
                        dir="auto"
                        className="line-clamp-2 text-start text-[17px] font-bold break-words text-ink"
                      >
                        {property.address}
                      </h3>
                      <p className="mt-1 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-ink tabular-nums">
                          ${property.price_per_night}
                        </span>
                        <span className="text-[13px] text-[#8A8073]">
                          {t("perNight")}
                        </span>
                      </p>
                      {status === "approved" && listingPeriod && (
                        <p
                          className={`mt-1.5 flex items-center gap-1.5 text-[13px] ${LISTING_PERIOD_TONES[listingPeriod.tone]}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0"
                            aria-hidden="true"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                          {listingPeriod.text}
                        </p>
                      )}
                      {pendingEditIds.has(property.id) && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FDF3E1] px-2.5 py-1 text-xs font-semibold text-[#8A5A12] ring-1 ring-[#F0D9AE]">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                          {t("editPending")}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 md:w-64 md:shrink-0">
                      <AvailabilityModeSelect
                        propertyId={property.id}
                        initialMode={property.availability_mode}
                      />
                      <Link
                        href={`/owner/properties/${property.id}/edit`}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-ink px-3 text-sm font-semibold text-ink transition-[background-color,transform] duration-150 hover:bg-[#FAF7F2] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        {t("edit")}
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
