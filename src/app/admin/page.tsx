import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  redirect((await isAdminAuthenticated()) ? "/admin/properties" : "/admin/login");
}
