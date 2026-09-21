import { getTranslations, setRequestLocale } from "next-intl/server";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import EmailOtpForm from "@/components/EmailOtpForm";

export const dynamic = "force-dynamic";

export default async function OwnerLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
        <p className="mt-2 text-black/70 dark:text-white/70">
          {t("loginBody")}
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <GoogleLoginButton next={`/${locale}/owner/dashboard`} />
      </div>

      <div className="my-6 flex items-center gap-3 text-sm text-black/50 dark:text-white/50">
        <span className="h-px flex-1 bg-black/10 dark:bg-white/15" />
        {t("orDivider")}
        <span className="h-px flex-1 bg-black/10 dark:bg-white/15" />
      </div>

      <EmailOtpForm next="/owner/dashboard" />
    </div>
  );
}
