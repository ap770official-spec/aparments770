"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, adminSessionToken, isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password");

  if (
    typeof password === "string" &&
    process.env.ADMIN_PASSWORD &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, adminSessionToken(), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/admin",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/admin/properties");
  }

  redirect("/admin/login?error=1");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function approveProperty(propertyId: string) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("properties")
    .update({ approval_status: "approved" })
    .eq("id", propertyId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/properties");
}

export async function rejectProperty(propertyId: string) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("properties")
    .update({ approval_status: "rejected" })
    .eq("id", propertyId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/properties");
}
