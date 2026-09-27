"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/authClient";

export default function LogoutButton() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  async function handleClick() {
    await signOut();
    router.push("/owner/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md border border-black/15 px-4 py-2 text-sm"
    >
      {t("logout")}
    </button>
  );
}
