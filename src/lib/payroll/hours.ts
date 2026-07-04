/**
 * Aggregates raw time entries into payroll hour buckets.
 *
 * Rules (PH Labor Code, simplified for MVP):
 * - A time entry belongs to the calendar day of its clock-in.
 * - Hours beyond `workHoursPerDay` in a single day are overtime.
 * - Night differential covers work performed between 22:00 and 06:00.
 */

export type TimeEntryInput = {
  clockIn: Date;
  clockOut: Date | null;
};

export type HoursSummary = {
  regularHours: number;
  overtimeHours: number;
  nightDiffHours: number;
  daysWorked: number;
};

const MS_PER_HOUR = 3_600_000;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Hours of [start, end) overlapping the 22:00–06:00 night window. */
export function nightOverlapHours(start: Date, end: Date): number {
  let total = 0;
  // Check the night window starting on each day touched by the entry,
  // beginning the day before clock-in (its window spills into this morning).
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - 1);
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() < end.getTime()) {
    const windowStart = new Date(cursor);
    windowStart.setHours(22, 0, 0, 0);
    const windowEnd = new Date(cursor);
    windowEnd.setDate(windowEnd.getDate() + 1);
    windowEnd.setHours(6, 0, 0, 0);

    const overlapStart = Math.max(start.getTime(), windowStart.getTime());
    const overlapEnd = Math.min(end.getTime(), windowEnd.getTime());
    if (overlapEnd > overlapStart) total += (overlapEnd - overlapStart) / MS_PER_HOUR;

    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

export function summarizeHours(
  entries: TimeEntryInput[],
  workHoursPerDay: number,
): HoursSummary {
  const byDay = new Map<string, { worked: number; night: number }>();

  for (const entry of entries) {
    if (!entry.clockOut) continue; // open entries don't count until closed
    const worked = (entry.clockOut.getTime() - entry.clockIn.getTime()) / MS_PER_HOUR;
    if (worked <= 0) continue;
    const night = nightOverlapHours(entry.clockIn, entry.clockOut);
    const key = dayKey(entry.clockIn);
    const day = byDay.get(key) ?? { worked: 0, night: 0 };
    day.worked += worked;
    day.night += night;
    byDay.set(key, day);
  }

  let regular = 0;
  let overtime = 0;
  let night = 0;
  for (const day of byDay.values()) {
    regular += Math.min(day.worked, workHoursPerDay);
    overtime += Math.max(0, day.worked - workHoursPerDay);
    night += day.night;
  }

  return {
    regularHours: regular,
    overtimeHours: overtime,
    nightDiffHours: night,
    daysWorked: byDay.size,
  };
}
