import { getTranslations } from "next-intl/server";

type Step = {
  title: string;
  body: string;
};

export default async function HowItWorksSection() {
  const t = await getTranslations("howItWorks");
  const nav = await getTranslations("nav");
  const steps = t.raw("steps") as Step[];

  return (
    <section id="how-it-works" className="border-t border-border-soft">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-10 sm:py-14">
        <h2 className="font-serif-brand text-2xl font-bold text-ink sm:text-3xl">
          {nav("howItWorks")}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border-soft p-5"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground"
              >
                {index + 1}
              </span>
              <h3 className="mt-3 text-base font-bold">{step.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
