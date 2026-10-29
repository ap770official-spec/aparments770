import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/admin/properties"
          className="flex items-baseline gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="font-serif-brand text-lg font-semibold text-brand">
            Apartments770
          </span>
          <span className="text-sm text-black/60">ניהול</span>
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
