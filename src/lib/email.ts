const FROM_ADDRESS = "onboarding@resend.dev";

/**
 * Sends an app-triggered email via Resend's REST API directly (no SDK
 * dependency). Separate from Supabase's SMTP config, which only
 * handles Supabase Auth's own emails (OTP, magic link) - this is for
 * emails our own server actions send. Uses the same Resend account/
 * API key, just a different integration point.
 */
export async function sendEmail({
  to,
  subject,
  html,
  attachment,
}: {
  to: string;
  subject: string;
  html: string;
  attachment?: { filename: string; content: Uint8Array };
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      attachments: attachment
        ? [
            {
              filename: attachment.filename,
              content: Buffer.from(attachment.content).toString("base64"),
            },
          ]
        : undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
}
