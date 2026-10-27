import { createHash, timingSafeEqual } from "crypto";
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

/**
 * Constant-time string comparison, so response timing can't leak how
 * many leading characters of a guessed password/token were right.
 * Both sides are hashed first to get equal-length buffers.
 */
export function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return !!token && safeEqual(token, adminSessionToken());
}
