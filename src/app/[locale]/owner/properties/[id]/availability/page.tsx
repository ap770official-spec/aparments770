import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { requireOwner } from "@/lib/owner-session";
import { getAvailabilityDates } from "@/lib/availability";
import { hebrewDayLabels, hebrewMonthSpan } from "@/lib/hebrewDate";
import { getUpcomingHebrewHolidays } from "@/lib/hebrewHolidays";
import type { AvailabilityMode } from "@/lib/properties";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

export const dynamic = "force-dynamic";

/** How far ahead owners can mark nights. */
const MONTHS_AHEAD = 18;

/** Today in New York, where the listings are, as YYYY-MM-DD. */
function todayInNewYork(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());
}

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const { supabase, user } = await requireOwner(
    locale,
    `/owner/properties/${id}/availability`,
  );

  const { data: property, error } = await supabase
    .from("properties")
    .select("id, address, availability_mode")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load property: ${error.message}`);
  }
  if (!property) {
    notFound();
  }

  const today = todayInNewYork();
  const [year, month] = today.split("-").map(Number);
  const months = Array.from({ length: MONTHS_AHEAD }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 1 + i, 1));
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    return {
      key: `${y}-${String(m).padStart(2, "0")}`,
      hebrewLabel: hebrewMonthSpan(y, m),
    };
  });
  const rangeStart = `${months[0].key}-01`;
  const rangeEnd = new Date(Date.UTC(year, month - 1 + MONTHS_AHEAD, 1))
    .toISOString()
    .slice(0, 10);

  const rows = await getAvailabilityDates(
    supabase,
    [property.id],
    rangeStart,
    rangeEnd,
  );

  const holidays = Object.fromEntries(
    getUpcomingHebrewHolidays()
      .filter((h) => h.date >= rangeStart && h.date < rangeEnd)
      .map((h) => [h.date, locale === "he" ? h.nameHe : h.nameEn]),
  );

  return (
    <AvailabilityCalendar
      propertyId={property.id}
      address={property.address}
      initialMode={property.availability_mode as AvailabilityMode}
      initialDates={Object.fromEntries(rows.map((r) => [r.date, r.status]))}
      today={today}
      months={months}
      hebrewDays={hebrewDayLabels(rangeStart, rangeEnd)}
      holidays={holidays}
      locale={locale}
    />
  );
}
