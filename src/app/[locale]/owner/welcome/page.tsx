import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureOwnerRow, getOwnerProfile } from "@/lib/owners";
import { safeOwnerNext } from "@/lib/owner-session";
import { countryDialOptions, countryForDial } from "@/lib/countries";
import OwnerProfileForm from "@/components/OwnerProfileForm";

export const dynamic = "force-dynamic";

/**
 * The one-time "a few details first" screen after an owner's first
 * login (requireOwner sends them here), and later their "my details"
 * page from the dashboard.
 */
export default async function OwnerWelcomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("ownerProfile");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/owner/login", locale });
  }

  await ensureOwnerRow(supabase, user!.id);
  const profile = await getOwnerProfile(supabase, user!.id);
  const isEdit = Boolean(profile?.profile_completed_at);

  return (
    <div className="mx-auto max-w-xl px-4 py-9 sm:py-12">
      <h1 className="font-serif-brand text-[28px] font-bold text-ink">
        {isEdit ? t("editTitle") : t("title")}
      </h1>
      <p className="mt-1.5 mb-7 text-[15px] text-[#5C5349]">
        {isEdit ? t("editSubtitle") : t("subtitle")}
      </p>
      <OwnerProfileForm
        locale={locale}
        next={safeOwnerNext(next)}
        isEdit={isEdit}
        countries={countryDialOptions(locale)}
        initial={{
          firstName: profile?.first_name ?? "",
          lastName: profile?.last_name ?? "",
          country: countryForDial(profile?.phone_country_code),
          phoneNumber: profile?.phone_number ?? "",
          ownerRole: profile?.owner_role ?? "",
          referralSource: profile?.referral_source ?? "",
          referralOther: profile?.referral_other ?? "",
        }}
        termsAccepted={Boolean(profile?.terms_accepted_at)}
      />
    </div>
  );
}
