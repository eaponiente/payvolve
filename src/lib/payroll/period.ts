/** Semi-monthly cutoff helpers: 1st–15th and 16th–end of month. */

export type Period = { start: Date; end: Date };

export function semiMonthlyPeriodFor(date: Date): Period {
  const y = date.getFullYear();
  const m = date.getMonth();
  if (date.getDate() <= 15) {
    return {
      start: new Date(y, m, 1),
      end: new Date(y, m, 15, 23, 59, 59, 999),
    };
  }
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    start: new Date(y, m, 16),
    end: new Date(y, m, lastDay, 23, 59, 59, 999),
  };
}

export function previousSemiMonthlyPeriod(date: Date): Period {
  const current = semiMonthlyPeriodFor(date);
  const dayBefore = new Date(current.start.getTime() - 1);
  return semiMonthlyPeriodFor(dayBefore);
}

export function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatPeriod(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
