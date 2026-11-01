import type { User } from "@supabase/supabase-js";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureOwnerRow, getOwnerProfile, type OwnerProfile } from "@/lib/owners";

/**
 * Entry check for every owner-only page: sends visitors who aren't
 * logged in to the login page, and owners who haven't filled in their
 * details yet (new ones, and existing ones from before onboarding) to
 * the one-time details screen, which returns them to `next` after.
 */
export async function requireOwner(
  locale: string,
  next: string,
): Promise<{
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: User;
  profile: OwnerProfile;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: "/owner/login", locale });
  }

  await ensureOwnerRow(supabase, user.id);
  const profile = await getOwnerProfile(supabase, user.id);

  if (!profile?.profile_completed_at) {
    return redirect({
      href: { pathname: "/owner/welcome", query: { next } },
      locale,
    });
  }

  return { supabase, user, profile };
}

/**
 * Only local, owner-area paths are accepted as a post-details
 * destination, so ?next= can't be used to bounce people off-site.
 */
export function safeOwnerNext(next: string | undefined): string {
  return next && /^\/(owner|list-property)(\/|$|\?)/.test(next)
    ? next
    : "/owner/dashboard";
}
