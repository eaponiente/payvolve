/** Week helpers for scheduling. Weeks run Monday–Sunday. */

export type Week = { start: Date; end: Date; days: Date[] };

/** Monday 00:00 of the week containing `date` (local time). */
export function weekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sun … 6 = Sat
  const diff = dow === 0 ? -6 : 1 - dow; // shift back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

export function weekOf(date: Date): Week {
  const start = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end, days };
}

export function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

/** yyyy-mm-dd in local time (for URL params and date inputs). */
export function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse a yyyy-mm-dd key as a local date, or return null. */
export function parseDateKey(key: string | undefined | null): Date | null {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function shiftDurationHours(startsAt: Date, endsAt: Date): number {
  return Math.round(((endsAt.getTime() - startsAt.getTime()) / 3_600_000) * 100) / 100;
}

const timeFmt = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" });

export function formatShiftTime(startsAt: Date, endsAt: Date): string {
  return `${timeFmt.format(startsAt)}–${timeFmt.format(endsAt)}`;
}

export function formatWeekRange(week: Week): string {
  const fmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
  const fmtYear = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fmt.format(week.start)} – ${fmtYear.format(week.days[6])}`;
}
