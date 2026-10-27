"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LogoutButton() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  async function handleClick() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/owner/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-11 items-center rounded-lg border border-[#D8CFC0] px-4 text-sm font-semibold text-ink transition-[background-color,border-color,transform] duration-150 hover:border-ink hover:bg-[#FAF7F2] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {t("logout")}
    </button>
  );
}
