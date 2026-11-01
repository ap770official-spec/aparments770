import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { Logo } from "@/components/brand/Logo";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/admin/properties"
          className="flex items-center gap-3 rounded-md text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Logo />
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-sm text-black/60">
            ניהול
          </span>
        </Link>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="min-h-10 cursor-pointer rounded-md border border-black/15 px-4 text-sm transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            התנתקות
          </button>
        </form>
      </div>
    </header>
  );
}
