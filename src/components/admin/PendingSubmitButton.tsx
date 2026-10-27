"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit button for admin server-action forms that disables itself
 * while the action runs - approving sends an email + PDF, which can
 * take a few seconds, and without feedback it's easy to double-click.
 * An optional confirmMessage asks before submitting (for destructive
 * actions).
 */
export default function PendingSubmitButton({
  className,
  pendingLabel,
  confirmMessage,
  children,
}: {
  className?: string;
  pendingLabel: string;
  confirmMessage?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={(e) => {
        if (confirmMessage && !confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
