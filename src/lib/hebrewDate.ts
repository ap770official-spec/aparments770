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
