import { HDate, gematriya } from "@hebcal/core";

// Short Hebrew-calendar date for display (e.g. "כ״ג תשרי") - day in
// gematriya + month name, no year, matching how a returning guest would
// naturally refer to a date without needing the year spelled out.
export function formatHebrewDateShort(isoDate: string): string {
  const hdate = new HDate(new Date(`${isoDate}T00:00:00`));
  const [dayAndMonth] = hdate.render("he-x-NoNikud").split(",");
  const monthName = dayAndMonth.trim().split(" ").slice(1).join(" ");
  return `${gematriya(hdate.getDate())} ${monthName}`;
}

/**
 * Hebrew day-of-month (gematriya, e.g. "י״ב") for every date in
 * [from, to), for small labels under each calendar day. Built on the
 * server so the calendar doesn't ship @hebcal to the browser.
 */
export function hebrewDayLabels(from: string, to: string): Record<string, string> {
  const labels: Record<string, string> = {};
  const [y, m, d] = from.split("-").map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    if (iso >= to) break;
    const hdate = new HDate(new Date(`${iso}T00:00:00`));
    labels[iso] = gematriya(hdate.getDate());
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return labels;
}

/**
 * The Hebrew month(s) a Gregorian month spans, with the year, e.g.
 * "חשוון–כסלו תשפ״ז", for a calendar month heading.
 */
export function hebrewMonthSpan(year: number, month: number): string {
  const first = new HDate(new Date(year, month - 1, 1));
  const last = new HDate(new Date(year, month, 0));
  const monthName = (h: HDate) =>
    h.render("he-x-NoNikud").split(",")[0].trim().split(" ").slice(1).join(" ");
  const yearLabel = gematriya(last.getFullYear());
  const firstName = monthName(first);
  const lastName = monthName(last);
  return firstName === lastName
    ? `${firstName} ${yearLabel}`
    : `${firstName}–${lastName} ${yearLabel}`;
}
