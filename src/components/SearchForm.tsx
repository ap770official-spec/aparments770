"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Region } from "@/lib/regions";

export default function SearchForm({ regions }: { regions: Region[] }) {
  const t = useTranslations("searchForm");
  const router = useRouter();

  const [region, setRegion] = useState(regions[0]?.slug ?? "");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(1);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams({
      region,
      checkin,
      checkout,
      guests: String(guests),
    });

    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 grid gap-4 rounded-lg border border-black/10 p-4 sm:grid-cols-2 dark:border-white/15"
    >
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        {t("region")}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        >
          {regions.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name_he} / {r.name_en}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t("checkin")}
        <input
          type="date"
          value={checkin}
          onChange={(e) => setCheckin(e.target.value)}
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t("checkout")}
        <input
          type="date"
          value={checkout}
          onChange={(e) => setCheckout(e.target.value)}
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t("guests")}
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <button
        type="submit"
        className="rounded-md bg-foreground px-4 py-2 text-background sm:col-span-2 sm:self-end"
      >
        {t("submit")}
      </button>
    </form>
  );
}
