"use server";

import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AvailabilityMode } from "@/lib/properties";
import {
  getOwnerProfile,
  OWNER_ROLES,
  REFERRAL_SOURCES,
  type OwnerRole,
  type ReferralSource,
} from "@/lib/owners";
import { safeOwnerNext } from "@/lib/owner-session";
import { dialForCountry } from "@/lib/countries";

export async function updateAvailabilityMode(
  propertyId: string,
  mode: AvailabilityMode,
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("properties")
    .update({ availability_mode: mode })
    .eq("id", propertyId)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(`Failed to update availability: ${error.message}`);
  }
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
