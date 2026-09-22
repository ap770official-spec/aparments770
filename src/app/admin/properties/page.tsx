import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { approveProperty, logoutAdmin, rejectProperty } from "../actions";
import { geocodeLegacyProperties, geocodeRegions } from "../geocode-actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "ממתין לאישור",
  approved: "מאושר",
  rejected: "נדחה",
};

function defaultExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 365);
  return d.toISOString().slice(0, 10);
}

export default async function AdminPropertiesPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const supabase = createAdminSupabaseClient();
  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      "id, address, price_per_night, approval_status, created_at, phone_country_code, phone_number, owners(full_name), regions(name_he)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load properties: ${error.message}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">אישור דירות</h1>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/20"
          >
            התנתקות
          </button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-y border-black/10 py-3 text-sm dark:border-white/15">
        <span className="text-black/60 dark:text-white/60">
          כלי חד-פעמי למילוי קואורדינטות (Mapbox):
        </span>
        <form action={geocodeRegions}>
          <button
            type="submit"
            className="rounded-md border border-black/15 px-3 py-1 dark:border-white/20"
          >
            מלא קואורדינטות לאזורים
          </button>
        </form>
        <form action={geocodeLegacyProperties}>
          <button
            type="submit"
            className="rounded-md border border-black/15 px-3 py-1 dark:border-white/20"
          >
            מלא קואורדינטות לדירות ישנות
          </button>
        </form>
      </div>

      {properties.length === 0 ? (
        <p className="mt-6 text-black/70 dark:text-white/70">
          אין עדיין דירות במערכת.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/15">
                <th className="p-2 text-start">כתובת</th>
                <th className="p-2 text-start">אזור</th>
                <th className="p-2 text-start">בעלים</th>
                <th className="p-2 text-start">מחיר</th>
                <th className="p-2 text-start">סטטוס</th>
                <th className="p-2 text-start">טלפון</th>
                <th className="p-2 text-start">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr
                  key={property.id}
                  className="border-b border-black/5 dark:border-white/10"
                >
                  <td className="p-2">
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="underline underline-offset-2"
                    >
                      {property.address}
                    </Link>
                  </td>
                  <td className="p-2">
                    {(
                      property.regions as unknown as { name_he: string } | null
                    )?.name_he ?? "—"}
                  </td>
                  <td className="p-2">
                    {(
                      property.owners as unknown as {
                        full_name: string | null;
                      } | null
                    )?.full_name ?? "—"}
                  </td>
                  <td className="p-2">${property.price_per_night}</td>
                  <td className="p-2">
                    {STATUS_LABELS[property.approval_status] ??
                      property.approval_status}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <a
                        href={`tel:${property.phone_country_code}${property.phone_number}`}
                        className="underline underline-offset-2"
                      >
                        טלפון
                      </a>
                      <a
                        href={buildWhatsAppLink({
                          countryCode: property.phone_country_code,
                          phoneNumber: property.phone_number,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                      >
                        וואטסאפ
                      </a>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {property.approval_status !== "approved" && (
                        <form
                          action={approveProperty.bind(null, property.id)}
                          className="flex items-center gap-1"
                        >
                          <input
                            type="date"
                            name="expiresAt"
                            defaultValue={defaultExpiryDate()}
                            required
                            className="rounded-md border border-black/15 px-1 py-1 text-xs dark:border-white/20"
                          />
                          <button
                            type="submit"
                            className="rounded-md bg-foreground px-3 py-1 text-background"
                          >
                            אשר
                          </button>
                        </form>
                      )}
                      {property.approval_status !== "rejected" && (
                        <form action={rejectProperty.bind(null, property.id)}>
                          <button
                            type="submit"
                            className="rounded-md border border-black/15 px-3 py-1 dark:border-white/20"
                          >
                            דחה
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
