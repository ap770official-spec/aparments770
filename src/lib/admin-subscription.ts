export const EXPIRING_SOON_DAYS = 30;

export type SubscriptionState =
  | { kind: "none" }
  | { kind: "frozen" }
  | { kind: "expired"; expiresAt: Date }
  | { kind: "expiring"; expiresAt: Date; daysLeft: number }
  | { kind: "active"; expiresAt: Date };

/**
 * The owner's listing subscription, reduced to the one state the
 * admin cares about at a glance. Lives on the owner (one payment
 * covers all their listings), so every property of the same owner
 * shows the same state.
 */
export function subscriptionState(
  owner: { subscription_expires_at: string | null; is_frozen: boolean } | null,
  now = new Date(),
): SubscriptionState {
  if (!owner) return { kind: "none" };
  if (owner.is_frozen) return { kind: "frozen" };
  if (!owner.subscription_expires_at) return { kind: "none" };

  const expiresAt = new Date(owner.subscription_expires_at);
  const msLeft = expiresAt.getTime() - now.getTime();
  if (msLeft <= 0) return { kind: "expired", expiresAt };

  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  if (daysLeft <= EXPIRING_SOON_DAYS) {
    return { kind: "expiring", expiresAt, daysLeft };
  }
  return { kind: "active", expiresAt };
}

export function formatAdminDate(date: Date): string {
  return date.toLocaleDateString("en-GB");
}

/** Whether this state needs the admin's attention (renewal/payment). */
export function needsRenewal(state: SubscriptionState): boolean {
  return state.kind === "expired" || state.kind === "expiring" || state.kind === "frozen";
}
