import { getTranslations, setRequestLocale } from "next-intl/server";
import GoogleLoginButton from "@/components/GoogleLoginButton";

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
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
      <p className="mt-2 text-black/70 dark:text-white/70">
        {t("loginBody")}
      </p>
      <div className="mt-8">
        <GoogleLoginButton next={`/${locale}/owner/dashboard`} />
      </div>
    </div>
  );
}
