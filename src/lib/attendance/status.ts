import { nightOverlapHours } from "@/lib/payroll/hours";

/**
 * Derived attendance flags for a single time entry — used to surface lates,
 * overtime, undertime, and night work on the timesheet. Heuristic, for display
 * only (payroll math lives in lib/payroll).
 */
export const STANDARD_START_MIN = 9 * 60; // 09:00 assumed day-shift start
export const LATE_GRACE_MIN = 15; // grace period before a clock-in is "late"
export const DAY_SHIFT_LATEST_START_MIN = 12 * 60; // starts after noon aren't "late"

export type AttendanceStatus = {
  hours: number;
  minutesLate: number;
  late: boolean;
  overtime: boolean;
  undertime: boolean;
  night: boolean;
  open: boolean;
};

export function attendanceStatus(
  clockIn: Date,
  clockOut: Date | null,
  workHoursPerDay: number,
): AttendanceStatus {
  if (!clockOut) {
    return {
      hours: 0,
      minutesLate: 0,
      late: false,
      overtime: false,
      undertime: false,
      night: false,
      open: true,
    };
  }

  const hours =
    Math.round(((clockOut.getTime() - clockIn.getTime()) / 3_600_000) * 100) / 100;
  const startMin = clockIn.getHours() * 60 + clockIn.getMinutes();
  // Only morning/day shifts can be "late" — an evening or night start isn't.
  const isDayShift = startMin <= DAY_SHIFT_LATEST_START_MIN;
  const minutesLate = isDayShift
    ? Math.max(0, startMin - (STANDARD_START_MIN + LATE_GRACE_MIN))
    : 0;

  return {
    hours,
    minutesLate,
    late: minutesLate > 0,
    overtime: hours > workHoursPerDay + 0.001,
    undertime: hours < workHoursPerDay - 0.001,
    night: nightOverlapHours(clockIn, clockOut) > 0,
    open: false,
  };
}
