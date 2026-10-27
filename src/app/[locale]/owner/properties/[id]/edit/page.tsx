import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveRegions } from "@/lib/regions";
import { getOwnerPropertyForEdit } from "@/lib/properties";
import PropertyForm from "@/components/PropertyForm";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/owner/login", locale });
  }

  const [regions, property] = await Promise.all([
    getActiveRegions(),
    getOwnerPropertyForEdit(supabase, id, user!.id),
  ]);

  if (!property) {
    notFound();
  }

  return (
    <PropertyForm
      regions={regions}
      ownerId={user!.id}
      initialProperty={property}
    />
  );
}
