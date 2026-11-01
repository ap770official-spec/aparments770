import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import FaqAccordion from "@/components/FaqAccordion";
import { CONTACT_PHONE_DISPLAY, CONTACT_EMAIL } from "@/lib/contactInfo";

type FaqItem = { q: string; a: string };
type FaqGroup = { title: string; items: FaqItem[] };

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function ChatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.9-.9L3 20l1.1-4.4A8.3 8.3 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function WalkIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="13" cy="4" r="2" />
      <path d="m9 20 3-6 3 3v4M6 12l3-4 4 1 3 3 3 1M9 8l-1 6" />
    </svg>
  );
}

export function PinIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} width={15} height={15} className={className}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Three short promises under the hero search: why search here. */
export async function HomeTrustStrip() {
  const t = await getTranslations("home");
  const items = [
    { icon: <ChatIcon />, label: t("trustDirect") },
    { icon: <TagIcon />, label: t("trustNoFees") },
    { icon: <WalkIcon />, label: t("trustWalking") },
  ];
  return (
    <ul className="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-2.5 text-[14px] font-semibold text-ink-soft sm:text-[15px]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand ring-1 ring-line">
            {item.icon}
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export async function HomeHowItWorks() {
  const t = await getTranslations("home");
  const steps = [1, 2, 3] as const;
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="scroll-mt-4 border-t border-line bg-cream"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-10 sm:py-20">
        <div className="flex flex-col gap-2">
          <h2
            id="how-title"
            className="font-serif-brand text-2xl font-bold text-balance text-ink sm:text-[34px]"
          >
            {t("howTitle")}
          </h2>
          <p className="text-[15px] text-ink-soft sm:text-[17px]">
            {t("howSubtitle")}
          </p>
        </div>
        <ol className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-6">
          {steps.map((n) => (
            <li
              key={n}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6"
            >
              <span
                aria-hidden="true"
                className="font-serif-brand text-[40px] leading-none font-bold text-gold"
              >
                {n}
              </span>
              <h3 className="text-lg font-bold text-ink">
                {t(`howStep${n}Title`)}
              </h3>
              <p className="text-[15px] leading-relaxed text-ink-soft">
                {t(`howStep${n}Body`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function HomeFaq() {
  const t = await getTranslations("nav");
  const tFaq = await getTranslations("faq");

  const rawGroups = tFaq.raw("groups") as FaqGroup[];
  const groups: FaqGroup[] = rawGroups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      q: item.q,
      a: item.a
        .replace("{phone}", CONTACT_PHONE_DISPLAY)
        .replace("{email}", CONTACT_EMAIL),
    })),
  }));

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-4 border-t border-line bg-cream"
    >
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-10 sm:py-20">
        <div className="flex flex-col gap-2">
          <h2
            id="faq-title"
            className="font-serif-brand text-2xl font-bold text-balance text-ink sm:text-[34px]"
          >
            {t("faq")}
          </h2>
          <p className="text-[15px] text-ink-soft sm:text-[17px]">
            {tFaq("intro")}
          </p>
        </div>
        <div className="mt-8 sm:mt-10">
          <FaqAccordion groups={groups} />
        </div>
      </div>
    </section>
  );
}

export async function HomeOwnerCta() {
  const t = await getTranslations("home");
  return (
    <section aria-labelledby="owner-cta-title" className="bg-cream">
      <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-10 sm:pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-10 text-brand-foreground sm:px-12 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-gold-soft/30 blur-3xl"
          />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-xl flex-col gap-2">
              <h2
                id="owner-cta-title"
                className="font-serif-brand text-2xl font-bold text-balance sm:text-[32px]"
              >
                {t("ownerTitle")}
              </h2>
              <p className="text-[15px] leading-relaxed text-white/90 sm:text-[17px]">
                {t("ownerBody")}
              </p>
            </div>
            <Link
              href="/list-property"
              className="flex min-h-12 shrink-0 items-center justify-center rounded-full bg-white px-7 text-base font-bold text-brand transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [@media(hover:hover)]:hover:bg-cream"
            >
              {t("ownerCta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
