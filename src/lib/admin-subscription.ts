export const EXPIRING_SOON_DAYS = 30;

export type SubscriptionState =
  | { kind: "none" }
  | { kind: "expired"; expiresAt: Date }
  | { kind: "expiring"; expiresAt: Date; daysLeft: number }
  | { kind: "active"; expiresAt: Date };

/**
 * A listing's paid display period (properties.listing_expires_at,
 * set per property when the admin approves it), reduced to the one
 * state the admin cares about at a glance. An expired listing stays
 * "approved" but is hidden from the public site.
 */
export function subscriptionState(
  listingExpiresAt: string | null,
  now = new Date(),
): SubscriptionState {
  if (!listingExpiresAt) return { kind: "none" };

  const expiresAt = new Date(listingExpiresAt);
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

/** yyyy-mm-dd for a date input's value. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Whether this state needs the admin's attention (renewal/payment). */
export function needsRenewal(state: SubscriptionState): boolean {
  return state.kind === "expired" || state.kind === "expiring";
}

/** Label + color tone for the listing's "shown until" pill. */
export function expiryPill(state: SubscriptionState): {
  label: string;
  tone: "neutral" | "warning" | "danger";
} {
  switch (state.kind) {
    case "none":
      return { label: "מנוי ללא תאריך סיום", tone: "neutral" };
    case "expired":
      return { label: `פג ב-${formatAdminDate(state.expiresAt)} · לא מוצג`, tone: "danger" };
    case "expiring":
      return {
        label: `מנוי עד ${formatAdminDate(state.expiresAt)} · עוד ${state.daysLeft} ${state.daysLeft === 1 ? "יום" : "ימים"}`,
        tone: "warning",
      };
    case "active":
      return { label: `מנוי עד ${formatAdminDate(state.expiresAt)}`, tone: "neutral" };
  }
}

/** Date to prefill when editing: the current expiry, or a year from now. */
export function expiryInputValue(state: SubscriptionState): string {
  if (state.kind === "none") {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return toDateInputValue(d);
  }
  return toDateInputValue(state.expiresAt);
}
