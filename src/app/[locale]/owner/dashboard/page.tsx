import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireOwner } from "@/lib/owner-session";
import { subscriptionState } from "@/lib/admin-subscription";
import {
  getOwnerProperties,
  getPendingEditPropertyIds,
  isListingExpired,
  mainMedia,
} from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import LogoutButton from "@/components/LogoutButton";
import AvailabilityModeSelect from "@/components/AvailabilityModeSelect";
import EditSentDialog from "@/components/EditSentDialog";

export const dynamic = "force-dynamic";

const STATUS_TONES: Record<string, string> = {
  approved: "text-[#256240]",
  pending_approval: "text-[#8A5A12]",
  rejected: "text-[#9B2C2C]",
};

const CALENDAR_PATHS = (
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>
);

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

const primaryButton =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-semibold text-brand-foreground shadow-[0_6px_16px_-8px_rgba(110,78,55,0.6)] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

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

  const { supabase, user, profile } = await requireOwner(
    locale,
    "/owner/dashboard",
  );
  const [properties, pendingEditIds] = await Promise.all([
    getOwnerProperties(supabase, user.id),
    getPendingEditPropertyIds(supabase, user.id),
  ]);

  const formatDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formatShortDate = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const liveListings = properties.filter(
    (p) =>
      p.approval_status === "approved" &&
      !isListingExpired(p.listing_expires_at),
  );
  const pendingCount = properties.filter(
    (p) => p.approval_status === "pending_approval",
  ).length;
  // Each listing has its own paid period; the soonest one to end is
  // the date worth surfacing.
  const nextExpiry = liveListings
    .map((p) => p.listing_expires_at)
    .filter((d): d is string => d !== null)
    .sort()[0];

  const stats = [
    { label: t("statLive"), value: String(liveListings.length) },
    { label: t("statPending"), value: String(pendingCount) },
    {
      label: t("statNextExpiry"),
      value: nextExpiry ? formatShortDate.format(new Date(nextExpiry)) : "—",
    },
  ];

  return (
    <div className="min-h-full bg-cream font-owner">
      {edit === "sent" && <EditSentDialog />}
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:pt-14">
        <header className="text-center">
          <p className="inline-flex items-center gap-3 text-xs font-bold tracking-[0.18em] text-gold before:h-px before:w-9 before:bg-gold-soft after:h-px after:w-9 after:bg-gold-soft">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 font-serif-brand text-[40px] leading-tight font-normal text-balance text-ink sm:text-[50px]">
            {profile.first_name ? (
              <bdi>{t("greeting", { name: profile.first_name })}</bdi>
            ) : (
              t("title")
            )}
          </h1>
          <p className="mt-1.5 truncate text-[15px] text-ink-muted">
            {user.email}
          </p>
          <div className="mt-3 flex items-center justify-center gap-1">
            <Link
              href="/owner/welcome"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand transition-colors duration-150 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              {t("myDetails")}
            </Link>
            <LogoutButton className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-3 text-sm font-semibold text-ink-muted transition-colors duration-150 hover:bg-white/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand" />
          </div>
        </header>

        <dl className="mx-auto mt-9 grid max-w-3xl grid-cols-3 rounded-[20px] bg-white shadow-[0_10px_30px_-18px_rgba(110,78,55,0.35)]">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col-reverse items-center gap-1 px-2 py-5 text-center sm:py-6 ${
                index > 0 ? "border-s border-[#EFE6D8]" : ""
              }`}
            >
              <dt className="text-[13px] text-ink-muted">{stat.label}</dt>
              <dd className="font-serif-brand text-2xl font-medium text-gold tabular-nums sm:text-[32px]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-12" aria-labelledby="my-properties-heading">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E6DCCB] pb-4">
            <h2
              id="my-properties-heading"
              className="font-serif-brand text-[26px] font-medium text-ink"
            >
              {t("myProperties")}
            </h2>
            {properties.length > 0 && (
              <Link href="/owner/properties/new" className={primaryButton}>
                <PlusIcon />
                {t("addProperty")}
              </Link>
            )}
          </div>

          {properties.length === 0 ? (
            <div className="mt-6 flex flex-col items-center rounded-[22px] bg-white px-6 py-14 text-center shadow-[0_12px_32px_-20px_rgba(110,78,55,0.45)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-gold">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 10.5 12 3l9 7.5" />
                  <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
                  <path d="M10 21v-6h4v6" />
                </svg>
              </div>
              <p className="mt-4 max-w-xs text-[15px] text-ink-soft">
                {t("noProperties")}
              </p>
              <Link
                href="/owner/properties/new"
                className={`mt-5 ${primaryButton}`}
              >
                <PlusIcon />
                {t("addProperty")}
              </Link>
            </div>
          ) : (
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {properties.map((property) => {
                const media = mainMedia(property.property_photos);
                const status = property.approval_status;
                // Approved but past its paid period: hidden from guests
                // (see notExpiredFilter in lib/properties.ts).
                const expired =
                  status === "approved" &&
                  isListingExpired(property.listing_expires_at);
                const period = subscriptionState(property.listing_expires_at);
                const expiryDate =
                  period.kind === "none"
                    ? null
                    : formatDate.format(period.expiresAt);
                return (
                  <li
                    key={property.id}
                    className="flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_12px_32px_-20px_rgba(110,78,55,0.45)]"
                  >
                    <div className="relative aspect-[16/10] w-full bg-placeholder md:aspect-auto md:h-48">
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
                        className={`absolute start-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-sm ${
                          STATUS_TONES[expired ? "rejected" : status] ??
                          STATUS_TONES.pending_approval
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-[7px] w-[7px] rounded-full bg-current"
                        />
                        {expired
                          ? t("expiredBadge")
                          : status === "approved"
                            ? t("liveBadge")
                            : t(`status.${status}`)}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3
                          dir="auto"
                          className="line-clamp-2 min-w-0 text-start text-[19px] font-semibold break-words text-ink"
                        >
                          {property.address}
                        </h3>
                        <p className="flex shrink-0 items-baseline gap-1 whitespace-nowrap">
                          <span className="font-serif-brand text-2xl font-medium text-ink tabular-nums">
                            ${property.price_per_night}
                          </span>
                          <span className="text-[13px] text-ink-muted">
                            {t("perNight")}
                          </span>
                        </p>
                      </div>

                      {status === "approved" && !expired && expiryDate && (
                        <p
                          className={`mt-2 flex items-center gap-1.5 text-[13px] font-semibold ${
                            period.kind === "expiring"
                              ? "text-[#8A5A12]"
                              : "text-gold"
                          }`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0"
                            aria-hidden="true"
                          >
                            {CALENDAR_PATHS}
                          </svg>
                          {period.kind === "expiring"
                            ? t("visibleUntilSoon", {
                                date: expiryDate,
                                days: period.daysLeft,
                              })
                            : t("visibleUntil", { date: expiryDate })}
                        </p>
                      )}
                      {status === "pending_approval" && (
                        <p className="mt-2 text-[13px] text-ink-muted">
                          {t("publishAfterApproval")}
                        </p>
                      )}
                      {expired && expiryDate && (
                        <p
                          role="status"
                          className="mt-3 rounded-xl bg-[#FBEAEA] px-3.5 py-2.5 text-[13px] leading-5 font-medium text-[#9B2C2C]"
                        >
                          {t("notVisible", { date: expiryDate })}
                        </p>
                      )}
                      {pendingEditIds.has(property.id) && (
                        <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FDF3E1] px-3 py-1 text-xs font-semibold text-[#8A5A12]">
                          <svg
                            width="12"
                            height="12"
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
                          {t("editPending")}
                        </p>
                      )}

                      <div aria-hidden="true" className="min-h-5 flex-1" />
                      <div className="flex items-end gap-2.5 border-t border-[#F0E8DC] pt-4">
                        <div className="min-w-0 flex-1">
                          <AvailabilityModeSelect
                            propertyId={property.id}
                            initialMode={property.availability_mode}
                            hideLabel
                            selectClassName="border border-transparent bg-[#FAF6F0] hover:border-[#E6DCCB]"
                          />
                        </div>
                        <Link
                          href={`/owner/properties/${property.id}/edit`}
                          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-gold-soft px-4 text-sm font-bold text-brand transition-[background-color,transform] duration-150 hover:bg-[#FAF6F0] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
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
    </div>
  );
}
