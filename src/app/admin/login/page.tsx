import { loginAdmin } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">כניסת מנהל</h1>
      <p className="mt-2 text-black/70">
        אזור פנימי לניהול האתר — לא חלק מהאתר הציבורי.
      </p>
      <form action={loginAdmin} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          סיסמה
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="rounded-md border border-black/15 bg-transparent px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">סיסמה שגויה.</p>}
        <button
          type="submit"
          className="mt-2 rounded-md bg-foreground px-4 py-2 text-background"
        >
          כניסה
        </button>
      </form>
    </div>
  );
}
