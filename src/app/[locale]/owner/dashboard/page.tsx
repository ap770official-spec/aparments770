import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureOwnerRow } from "@/lib/owners";
import { getOwnerProperties, mainMedia } from "@/lib/properties";
import { optimizedCloudinaryUrl } from "@/lib/cloudinary";
import LogoutButton from "@/components/LogoutButton";
import AvailabilityModeSelect from "@/components/AvailabilityModeSelect";

export const dynamic = "force-dynamic";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <LogoutButton />
      </div>
      <p className="mt-4 text-black/70">
        {t("loggedInAs", { email: user!.email ?? "" })}
      </p>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("myProperties")}</h2>
          <Link
            href="/owner/properties/new"
            className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
          >
            {t("addProperty")}
          </Link>
        </div>

        {properties.length === 0 ? (
          <p className="mt-2 text-black/70">
            {t("noProperties")}
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {properties.map((property) => {
              const media = mainMedia(property.property_photos);
              return (
                <li
                  key={property.id}
                  className="overflow-hidden rounded-lg border border-black/10"
                >
                  {media ? (
                    media.media_type === "video" ? (
                      <video
                        src={optimizedCloudinaryUrl(media.url)}
                        className="h-32 w-full object-cover"
                        muted
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={optimizedCloudinaryUrl(media.url)}
                        alt={property.address}
                        className="h-32 w-full object-cover"
                      />
                    )
                  ) : (
                    <div className="h-32 w-full bg-black/5" />
                  )}
                  <div className="p-3">
                    <p className="font-medium">{property.address}</p>
                    <p className="text-sm text-black/70">
                      ${property.price_per_night} {t("perNight")}
                    </p>
                    <span className="mt-1 inline-block rounded-full border border-black/10 px-2 py-0.5 text-xs">
                      {t(`status.${property.approval_status}`)}
                    </span>

                    <AvailabilityModeSelect
                      propertyId={property.id}
                      initialMode={property.availability_mode}
                    />

                    <Link
                      href={`/owner/properties/new?duplicate=${property.id}`}
                      className="mt-2 inline-block text-xs underline underline-offset-2"
                    >
                      {t("duplicate")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
