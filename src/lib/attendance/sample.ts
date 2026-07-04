/**
 * Deterministic, varied demo attendance so the timesheet and payroll show
 * realistic behaviour: on-time days, lates, undertime, overtime, night/closing
 * shifts, and absences. Pure date logic (no imports) so both the seed script
 * and one-off backfills can use it.
 *
 * Employees are matched to a pattern by their order (0-based). The demo order is
 * Manager, Head Cook, Server, Barista.
 */

export type SampleEntry = { employeeId: string; clockIn: Date; clockOut: Date };

type DayPlan = { sh: number; sm: number; eh: number; em: number } | null; // null = absent

/** Plan for employee `idx` on the `k`-th working day of a repeating 7-day cycle. */
function planFor(idx: number, k: number): DayPlan {
  switch (idx) {
    case 0: // Manager — reliable, one recurring late, never absent
      return k === 3 ? { sh: 9, sm: 40, eh: 17, em: 0 } : { sh: 9, sm: 0, eh: 17, em: 0 };
    case 1: // Head cook — closing shift (OT + night), one recurring absence
      return k === 5 ? null : { sh: 14, sm: 0, eh: 23, em: 0 };
    case 2: // Server — lates, an undertime day, one absence
      if (k === 2) return null; // absent
      if (k === 4) return { sh: 9, sm: 0, eh: 13, em: 0 }; // undertime (4h)
      if (k === 1 || k === 6) return { sh: 9, sm: 50, eh: 17, em: 10 }; // late
      return { sh: 9, sm: 0, eh: 17, em: 0 };
    default: // Barista (hourly) — variable hours, a big OT day, two absences
      if (k === 1 || k === 6) return null; // absent
      if (k === 3) return { sh: 9, sm: 0, eh: 20, em: 0 }; // overtime (11h)
      if (k === 5) return { sh: 10, sm: 15, eh: 17, em: 0 }; // late start
      return { sh: 9, sm: 0, eh: 15, em: 0 }; // short 6h day
  }
}

/**
 * Build entries for every working day (Mon–Sat) in `[period.start, period.end]`.
 * Absences simply produce no row for that employee/day.
 */
export function buildSampleAttendance(
  employees: { id: string }[],
  period: { start: Date; end: Date },
): SampleEntry[] {
  const entries: SampleEntry[] = [];
  const day = new Date(period.start);
  day.setHours(0, 0, 0, 0);
  let workingDay = 0;

  while (day <= period.end) {
    if (day.getDay() !== 0) {
      // closed Sundays
      employees.forEach((emp, idx) => {
        const plan = planFor(idx, workingDay % 7);
        if (!plan) return; // absent
        const clockIn = new Date(day);
        clockIn.setHours(plan.sh, plan.sm, 0, 0);
        const clockOut = new Date(day);
        clockOut.setHours(plan.eh, plan.em, 0, 0);
        entries.push({ employeeId: emp.id, clockIn, clockOut });
      });
      workingDay++;
    }
    day.setDate(day.getDate() + 1);
  }
  return entries;
}
