import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveRegions } from "@/lib/regions";
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

  const regions = await getActiveRegions();

  return <PropertyForm regions={regions} ownerId={user!.id} />;
}
