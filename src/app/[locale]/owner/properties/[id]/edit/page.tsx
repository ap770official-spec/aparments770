import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { requireOwner } from "@/lib/owner-session";
import { getActiveRegions, getDefaultRegion } from "@/lib/regions";
import {
  getOwnerPropertyForEdit,
  getPendingPropertyEdit,
  withPendingEdit,
} from "@/lib/properties";
import PropertyForm from "@/components/PropertyForm";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const { supabase, user } = await requireOwner(
    locale,
    `/owner/properties/${id}/edit`,
  );

  const [regions, defaultRegion, property] = await Promise.all([
    getActiveRegions(),
    getDefaultRegion(),
    getOwnerPropertyForEdit(supabase, id, user.id),
  ]);

  if (!property) {
    notFound();
  }

  const pendingEdit = await getPendingPropertyEdit(supabase, property.id);

  return (
    <PropertyForm
      regions={regions}
      defaultRegionId={defaultRegion?.id ?? ""}
      ownerId={user.id}
      initialProperty={
        pendingEdit ? withPendingEdit(property, pendingEdit.payload) : property
      }
      hasPendingEdit={pendingEdit !== null}
    />
  );
}
