"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Step = "email" | "code";

export default function EmailOtpForm({ next }: { next: string }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    setLoading(false);
    if (error) {
      setError(t("errorGeneric"));
      return;
    }
    setStep("code");
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    setLoading(false);
    if (error) {
      setError(t("errorGeneric"));
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
        <p className="text-sm text-black/70">
          {t("codeSentTo", { email })}
        </p>
        <label className="flex flex-col gap-1 text-start text-sm">
          {t("codeLabel")}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 tracking-widest"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
        >
          {t("verifyCode")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-start text-sm">
        {t("emailLabel")}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-black/15 px-4 py-2 disabled:opacity-60"
      >
        {t("sendCode")}
      </button>
    </form>
  );
}
