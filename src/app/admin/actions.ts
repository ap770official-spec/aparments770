"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, adminSessionToken, isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateSubscriptionPdf } from "@/lib/subscription-pdf";
import { sendEmail } from "@/lib/email";

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

/**
 * Approving a property also opens the owner's yearly (or whatever
 * length the admin picks) listing subscription and emails them a PDF
 * confirmation - approval and payment sign-off are the same action
 * here, since payment itself happens off-platform (WhatsApp + bank
 * transfer) before the admin ever clicks approve. The subscription
 * lives on the owner, not the property, since one payment covers all
 * of that owner's listings.
 *
 * Email delivery failures don't roll back the approval or the
 * subscription date - those are the parts that matter operationally,
 * and are already visible/correct in the DB even if the email never
 * arrives. The admin can always resend by re-approving.
 */
export async function approveProperty(propertyId: string, formData: FormData) {
  await requireAdmin();

  const expiresAtInput = formData.get("expiresAt");
  if (typeof expiresAtInput !== "string" || !expiresAtInput) {
    throw new Error("יש לבחור תאריך תוקף לפני אישור");
  }
  const expiresAt = new Date(`${expiresAtInput}T23:59:59`);

  const supabase = createAdminSupabaseClient();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, owner_id, address, price_per_night, regions(name_he), owners(full_name)")
    .eq("id", propertyId)
    .single();
  if (propertyError || !property) {
    throw new Error(propertyError?.message ?? "הדירה לא נמצאה");
  }

  const { error: approveError } = await supabase
    .from("properties")
    .update({ approval_status: "approved" })
    .eq("id", propertyId);
  if (approveError) throw new Error(approveError.message);

  const { error: subscriptionError } = await supabase
    .from("owners")
    .update({ subscription_expires_at: expiresAt.toISOString(), is_frozen: false })
    .eq("id", property.owner_id);
  if (subscriptionError) throw new Error(subscriptionError.message);

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);

  try {
    const { data: userData } = await supabase.auth.admin.getUserById(
      property.owner_id,
    );
    const ownerEmail = userData?.user?.email;
    if (ownerEmail) {
      const regionName =
        (property.regions as unknown as { name_he: string } | null)?.name_he ??
        "—";
      const ownerName =
        (property.owners as unknown as { full_name: string | null } | null)
          ?.full_name ?? "בעל הדירה";

      const pdfBytes = await generateSubscriptionPdf({
        ownerName,
        address: property.address,
        regionName,
        pricePerNight: property.price_per_night,
        approvedAt: new Date(),
        expiresAt,
      });

      await sendEmail({
        to: ownerEmail,
        subject: "הדירה שלך אושרה ופורסמה באתר",
        html: `<p>שלום,</p><p>הדירה בכתובת ${property.address} אושרה ותופיע באתר עד ${expiresAt.toLocaleDateString("en-GB")}.</p><p>מסמך אישור מצורף.</p>`,
        attachment: {
          filename: "אישור-פרסום-דירה.pdf",
          content: pdfBytes,
        },
      });
    }
  } catch (emailError) {
    console.error("Failed to send approval confirmation email:", emailError);
  }
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

/**
 * Permanently deletes a property. Cascades to its amenities and
 * photo/video rows (on delete cascade in the schema) - but not the
 * actual files in Cloudinary, which are left orphaned. Fine for now
 * at this scale; would need a Cloudinary API call to also remove
 * those if that ever becomes worth doing.
 */
export async function deleteProperty(propertyId: string) {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/properties");
  redirect("/admin/properties");
}
