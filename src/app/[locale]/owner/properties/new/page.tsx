import { setRequestLocale } from "next-intl/server";
import { requireOwner } from "@/lib/owner-session";
import { getActiveRegions, getDefaultRegion } from "@/lib/regions";
import PropertyForm from "@/components/PropertyForm";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { user, profile } = await requireOwner(
    locale,
    "/owner/properties/new",
  );

  const [regions, defaultRegion] = await Promise.all([
    getActiveRegions(),
    getDefaultRegion(),
  ]);

  return (
    <PropertyForm
      regions={regions}
      defaultRegionId={defaultRegion?.id ?? ""}
      ownerId={user.id}
      defaultPhone={
        profile.phone_country_code && profile.phone_number
          ? {
              countryCode: profile.phone_country_code,
              number: profile.phone_number,
            }
          : undefined
      }
    />
  );
}
