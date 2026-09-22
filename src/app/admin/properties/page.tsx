import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { approveProperty, logoutAdmin, rejectProperty } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "ממתין לאישור",
  approved: "מאושר",
  rejected: "נדחה",
};

export default async function AdminPropertiesPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const supabase = createAdminSupabaseClient();
  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      "id, address, price_per_night, approval_status, created_at, owners(full_name), regions(name_he)",
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
                <th className="p-2 text-start">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr
                  key={property.id}
                  className="border-b border-black/5 dark:border-white/10"
                >
                  <td className="p-2">{property.address}</td>
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
                      {property.approval_status !== "approved" && (
                        <form action={approveProperty.bind(null, property.id)}>
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
