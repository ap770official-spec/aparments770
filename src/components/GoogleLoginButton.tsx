"use client";

import { useTranslations } from "next-intl";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function GoogleLoginButton({ next }: { next: string }) {
  const t = useTranslations("auth");

  async function handleClick() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md bg-foreground px-6 py-3 text-background"
    >
      {t("continueWithGoogle")}
    </button>
  );
}
