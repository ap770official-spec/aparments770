import { HebrewCalendar, type CalOptions } from "@hebcal/core";

export type HolidayMarker = {
  date: string;
  nameHe: string;
  nameEn: string;
};

// Only the holidays travelers actually care about landing on — not every
// minor fast, Rosh Chodesh, or modern/Israeli observance @hebcal/core knows
// about. Matched against Event.basename(), which strips "Erev"/day-number
// qualifiers (e.g. "Sukkot III (CH''M)" -> "Sukkot").
const RELEVANT_BASENAMES = new Set([
  "Rosh Hashana",
  "Yom Kippur",
  "Sukkot",
  "Shmini Atzeret",
  "Simchat Torah",
  "Pesach",
  "Shavuot",
  "Lag BaOmer",
  "Purim",
  "Chanukah",
  "Tish'a B'Av",
]);

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Computed locally (no network calls) - safe to call on every request.
// Covers the current Gregorian year plus the next two, comfortably ahead
// of anything a search-date calendar would let someone navigate to.
export function getUpcomingHebrewHolidays(): HolidayMarker[] {
  const options: CalOptions = {
    year: new Date().getFullYear(),
    numYears: 3,
    noMinorFast: true,
    noModern: true,
    noRoshChodesh: true,
    noSpecialShabbat: true,
  };

  const byDate = new Map<string, HolidayMarker>();
  for (const event of HebrewCalendar.calendar(options)) {
    if (!RELEVANT_BASENAMES.has(event.basename())) continue;

    const date = toISODate(event.greg());
    const nameHe = event.render("he");
    const nameEn = event.render("en");
    const existing = byDate.get(date);
    if (existing) {
      existing.nameHe += ` / ${nameHe}`;
      existing.nameEn += ` / ${nameEn}`;
    } else {
      byDate.set(date, { date, nameHe, nameEn });
    }
  }

  return [...byDate.values()];
}
