import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureOwnerRow } from "@/lib/owners";
import { getOwnerProperties, mainPhotoUrl } from "@/lib/properties";
import LogoutButton from "@/components/LogoutButton";

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
      <p className="mt-4 text-black/70 dark:text-white/70">
        {t("loggedInAs", { email: user!.email ?? "" })}
      </p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">{t("myProperties")}</h2>

        {properties.length === 0 ? (
          <p className="mt-2 text-black/70 dark:text-white/70">
            {t("noProperties")}
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {properties.map((property) => {
              const photo = mainPhotoUrl(property.property_photos);
              return (
                <li
                  key={property.id}
                  className="overflow-hidden rounded-lg border border-black/10 dark:border-white/15"
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={property.address}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="h-32 w-full bg-black/5 dark:bg-white/10" />
                  )}
                  <div className="p-3">
                    <p className="font-medium">{property.address}</p>
                    <p className="text-sm text-black/70 dark:text-white/70">
                      ${property.price_per_night} {t("perNight")}
                    </p>
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
