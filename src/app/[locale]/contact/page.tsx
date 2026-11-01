import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_URL,
  CONTACT_EMAIL,
} from "@/lib/contactInfo";

function PhoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 1 1 17 .5z" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("footer");
  const tContact = await getTranslations("contactPage");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif-brand text-2xl font-bold text-ink sm:text-[30px]">
        {t("contact")}
      </h1>
      <p className="mt-2 max-w-[560px] text-sm text-ink-soft">
        {tContact("intro")}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:max-w-md">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-whatsapp/10 text-accent-whatsapp">
              <ChatIcon />
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-ink-muted">
                {tContact("whatsappLabel")}
              </span>
              <span dir="ltr" className="text-end text-sm font-semibold text-ink">
                {CONTACT_PHONE_DISPLAY}
              </span>
            </div>
          </div>
          <a
            href={CONTACT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-sm font-bold text-brand-foreground"
          >
            {tContact("whatsappCta")}
          </a>
        </div>

        <a
          href={`tel:${CONTACT_PHONE_TEL}`}
          className="flex items-center gap-3 rounded-2xl border border-line p-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft">
            <PhoneIcon />
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-ink-muted">
              {tContact("phoneLabel")}
            </span>
            <span dir="ltr" className="text-end text-sm font-semibold text-ink">
              {CONTACT_PHONE_DISPLAY}
            </span>
          </div>
        </a>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-3 rounded-2xl border border-line p-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft">
            <EnvelopeIcon />
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-ink-muted">
              {tContact("emailLabel")}
            </span>
            <span dir="ltr" className="text-end text-sm font-semibold text-ink">
              {CONTACT_EMAIL}
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}
