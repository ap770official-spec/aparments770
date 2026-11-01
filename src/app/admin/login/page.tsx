import { loginAdmin } from "../actions";
import { Logo } from "@/components/brand/Logo";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <main className="w-full max-w-sm">
        <div className="flex justify-center text-brand">
          <Logo />
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-[0_4px_24px_rgba(26,21,18,0.06)] sm:p-7">
          <h1 className="font-serif-brand text-2xl font-bold text-ink">כניסת מנהל</h1>
          <p className="mt-1 text-sm text-ink-soft">
            אזור פנימי לניהול האתר — לא חלק מהאתר הציבורי.
          </p>

          <form action={loginAdmin} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-ink">
                סיסמה
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required
                autoFocus
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "password-error" : undefined}
                className={`min-h-11 w-full rounded-lg border bg-white px-3 text-base text-ink transition-colors focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 ${
                  error ? "border-red-600/50" : "border-line"
                }`}
              />
              {error && (
                <p id="password-error" role="alert" className="text-sm font-medium text-red-700">
                  הסיסמה שגויה. נסה שוב.
                </p>
              )}
            </div>
            <PendingSubmitButton
              pendingLabel="נכנס…"
              className="min-h-11 w-full cursor-pointer rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              כניסה
            </PendingSubmitButton>
          </form>
        </div>
      </main>
    </div>
  );
}
