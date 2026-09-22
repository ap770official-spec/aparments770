import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";

/**
 * A fixed token derived from ADMIN_PASSWORD (never the raw password
 * itself) that we store in the admin's cookie after a correct login.
 * This is a single shared-password gate for one admin (the site
 * owner) - not a real user-accounts system. Good enough for this
 * scale; revisit if more than one admin ever needs separate access.
 */
export function adminSessionToken(): string {
  return createHash("sha256")
    .update(process.env.ADMIN_PASSWORD ?? "")
    .digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === adminSessionToken();
}
