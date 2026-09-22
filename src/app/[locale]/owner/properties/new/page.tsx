import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveRegions } from "@/lib/regions";
import { getOwnerPropertyForDuplicate } from "@/lib/properties";
import PropertyForm from "@/components/PropertyForm";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ duplicate?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { duplicate } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/owner/login", locale });
  }

  const regions = await getActiveRegions();
  const initialProperty = duplicate
    ? await getOwnerPropertyForDuplicate(supabase, duplicate, user!.id)
    : null;

  return (
    <PropertyForm
      regions={regions}
      ownerId={user!.id}
      initialProperty={initialProperty ?? undefined}
    />
  );
}
