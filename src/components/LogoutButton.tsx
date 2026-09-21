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
      className="rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/20"
    >
      {t("logout")}
    </button>
  );
}
