"use server";

import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AvailabilityMode } from "@/lib/properties";
import { isIsoDate, type AvailabilityStatus } from "@/lib/availability";
import {
  getOwnerProfile,
  OWNER_ROLES,
  REFERRAL_SOURCES,
  type OwnerRole,
  type ReferralSource,
} from "@/lib/owners";
import { safeOwnerNext } from "@/lib/owner-session";
import { dialForCountry } from "@/lib/countries";

const AVAILABILITY_MODES: AvailabilityMode[] = [
  "default_open_block_dates",
  "default_closed_open_dates",
  "fully_locked",
];

/** Upper bound on one save, well above a year and a half of nights. */
const MAX_AVAILABILITY_CHANGES = 1000;

/**
 * Saves an owner's availability calendar: the listing's mode plus the
 * nights they marked or cleared since the page loaded. Takes effect
 * immediately - availability isn't reviewed by the admin.
 */
export async function saveAvailability(
  propertyId: string,
  mode: AvailabilityMode,
  changes: { date: string; status: AvailabilityStatus | null }[],
): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    !AVAILABILITY_MODES.includes(mode) ||
    changes.length > MAX_AVAILABILITY_CHANGES ||
    !changes.every(
      (c) =>
        isIsoDate(c.date) &&
        (c.status === null || c.status === "blocked" || c.status === "open"),
    )
  ) {
    return { ok: false };
  }

  // Doubles as the ownership check: no row updated = not their listing.
  const { data: updated, error: modeError } = await supabase
    .from("properties")
    .update({ availability_mode: mode })
    .eq("id", propertyId)
    .eq("owner_id", user.id)
    .select("id");
  if (modeError || !updated?.length) {
    console.error("Failed to save availability mode:", modeError?.message);
    return { ok: false };
  }

  const upserts = changes
    .filter((c) => c.status !== null)
    .map((c) => ({ property_id: propertyId, date: c.date, status: c.status }));
  const removals = changes.filter((c) => c.status === null).map((c) => c.date);

  if (upserts.length > 0) {
    const { error } = await supabase
      .from("property_availability_dates")
      .upsert(upserts, { onConflict: "property_id,date" });
    if (error) {
      console.error("Failed to save availability dates:", error.message);
      return { ok: false };
    }
  }

  if (removals.length > 0) {
    const { error } = await supabase
      .from("property_availability_dates")
      .delete()
      .eq("property_id", propertyId)
      .in("date", removals);
    if (error) {
      console.error("Failed to clear availability dates:", error.message);
      return { ok: false };
    }
  }

  revalidatePath("/[locale]/owner/dashboard", "page");
  return { ok: true };
}

export type OwnerProfileField =
  | "firstName"
  | "lastName"
  | "phone"
  | "ownerRole"
  | "terms";

export type OwnerProfileFormState = {
  errors: Partial<Record<OwnerProfileField, true>>;
  saveFailed?: boolean;
};

function text(formData: FormData, name: string, max: number): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Saves the owner's details from the one-time details screen (and its
 * later "my details" edit), then continues to wherever they were
 * headed. Returns per-field errors instead when something required is
 * missing, so the form can show them next to each field.
 */
export async function saveOwnerProfile(
  _prev: OwnerProfileFormState,
  formData: FormData,
): Promise<OwnerProfileFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = text(formData, "locale", 5) || "he";

  if (!user) {
    return redirect({ href: "/owner/login", locale });
  }

  const firstName = text(formData, "firstName", 60);
  const lastName = text(formData, "lastName", 60);
  const dial = dialForCountry(text(formData, "country", 2));
  // Digits only, without a national trunk "0" (050... in Israel) - the
  // number is stored after its country code, as WhatsApp links need.
  const phoneNumber = text(formData, "phoneNumber", 30)
    .replace(/[^\d]/g, "")
    .replace(/^0+/, "");
  const ownerRole = text(formData, "ownerRole", 20) as OwnerRole;
  const referralInput = text(formData, "referralSource", 20) as ReferralSource;
  const referralSource = REFERRAL_SOURCES.includes(referralInput)
    ? referralInput
    : null;
  const referralOther =
    referralSource === "other" ? text(formData, "referralOther", 200) : "";

  const profile = await getOwnerProfile(supabase, user.id);
  const termsAlreadyAccepted = Boolean(profile?.terms_accepted_at);

  const errors: OwnerProfileFormState["errors"] = {};
  if (!firstName) errors.firstName = true;
  if (!lastName) errors.lastName = true;
  if (!dial || phoneNumber.length < 6 || phoneNumber.length > 15) {
    errors.phone = true;
  }
  if (!OWNER_ROLES.includes(ownerRole)) errors.ownerRole = true;
  if (!termsAlreadyAccepted && formData.get("terms") !== "on") {
    errors.terms = true;
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("owners")
    .update({
      first_name: firstName,
      last_name: lastName,
      // Admin screens and the approval PDF/email read full_name.
      full_name: `${firstName} ${lastName}`,
      phone_country_code: dial,
      phone_number: phoneNumber,
      owner_role: ownerRole,
      referral_source: referralSource,
      referral_other: referralOther || null,
      terms_accepted_at: profile?.terms_accepted_at ?? now,
      profile_completed_at: profile?.profile_completed_at ?? now,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to save owner profile:", error.message);
    return { errors: {}, saveFailed: true };
  }

  return redirect({
    href: safeOwnerNext(text(formData, "next", 200)),
    locale,
  });
}
