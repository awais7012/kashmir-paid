/**
 * Dates and times, in the site's one language. The locale is pinned rather than
 * left to the machine, and the masthead date carries a fixed time zone, so the
 * server render and the browser render always agree.
 */

const LOCALE = "en-GB";

/** A relative label for when a story went out. */
export function timeAgo(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  const format = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

  if (Math.abs(minutes) < 60) return format.format(minutes, "minute");
  if (Math.abs(minutes) < 1440) return format.format(Math.round(minutes / 60), "hour");
  return format.format(Math.round(minutes / 1440), "day");
}

/** Clock time, e.g. "3:12 pm". */
export function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE, { timeStyle: "short", timeZone: "UTC" }).format(date);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

/** The masthead date. */
export function formatToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(now);
}
