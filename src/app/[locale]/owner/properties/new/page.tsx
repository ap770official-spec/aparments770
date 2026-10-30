import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/owner/login", locale });
  }

  const [regions, defaultRegion] = await Promise.all([
    getActiveRegions(),
    getDefaultRegion(),
  ]);

  return (
    <PropertyForm
      regions={regions}
      defaultRegionId={defaultRegion?.id ?? ""}
      ownerId={user!.id}
    />
  );
}
