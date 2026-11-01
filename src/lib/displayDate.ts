/**
 * Dates as guests read them: Hebrew-calendar in Hebrew ("יום ו׳ כ״ו חשוון"),
 * short Gregorian in English. Uses Intl's Hebrew calendar, so it's safe for
 * client components (no @hebcal in the browser bundle).
 */

// Hebrew numerals for a day of the month (1-30), e.g. 15 -> ט״ו.
function gematriyaDay(day: number): string {
  if (day === 15) return "ט״ו";
  if (day === 16) return "ט״ז";
  const tens = ["", "י", "כ", "ל"][Math.floor(day / 10)];
  const units = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"][day % 10];
  const letters = tens + units;
  return letters.length === 1
    ? `${letters}׳`
    : `${letters.slice(0, -1)}״${letters.slice(-1)}`;
}

/**
 * Hebrew-calendar date ("כ״ג תשרי") in Hebrew, short Gregorian in English -
 * the same convention the page used before, without shipping @hebcal to the
 * browser (Intl already knows the Hebrew calendar).
 */
export function formatDisplayDate(date: Date, locale: string): string {
  if (locale !== "he") {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  const parts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
    day: "numeric",
    month: "long",
  }).formatToParts(date);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const weekday = date.toLocaleDateString("he-IL", { weekday: "short" });
  return `${weekday} ${gematriyaDay(day)} ${month}`;
}

/** Compact date for the mobile summary row: "ה׳ כסלו" / "Nov 5". */
export function formatShortDate(date: Date, locale: string): string {
  if (locale !== "he") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const parts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
    day: "numeric",
    month: "long",
  }).formatToParts(date);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return `${gematriyaDay(day)} ${month}`;
}
