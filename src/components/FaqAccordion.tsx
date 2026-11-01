"use client";

import { useId, useState } from "react";

type FaqItem = {
  q: string;
  a: string;
};

type FaqGroup = {
  title: string;
  items: FaqItem[];
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 text-text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-2xl border border-border-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start text-sm font-semibold sm:text-base"
      >
        <span>{item.q}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-text-secondary sm:text-[15px]"
        >
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{group.title}</h2>
          <div className="flex flex-col gap-2.5">
            {group.items.map((item) => (
              <AccordionItem key={item.q} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
