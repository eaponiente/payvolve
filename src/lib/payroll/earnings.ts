import { round2 } from "./money";
import type { HoursSummary } from "./hours";

/**
 * Earnings for one semi-monthly period.
 *
 * Rate conventions (common PH F&B practice, simplified for MVP):
 * - MONTHLY: basic = monthly rate / 2 per cutoff; equivalent daily rate uses a
 *   26-workday month for premium computations.
 * - DAILY: basic = days worked × daily rate.
 * - HOURLY: basic = regular hours × hourly rate.
 * - Overtime premium: 125% of the hourly rate for hours beyond the daily standard.
 * - Night differential: +10% of the hourly rate for hours worked 22:00–06:00.
 */

export type PayType = "MONTHLY" | "DAILY" | "HOURLY";

export type EarningsInput = {
  payType: PayType;
  baseRate: number;
  workHoursPerDay: number;
  hours: HoursSummary;
};

export type EarningsResult = {
  basicPay: number;
  overtimePay: number;
  nightDiffPay: number;
  gross: number;
  hourlyRate: number;
};

export const WORKDAYS_PER_MONTH = 26;
export const OVERTIME_MULTIPLIER = 1.25;
export const NIGHT_DIFF_RATE = 0.1;

export function hourlyRateOf(
  payType: PayType,
  baseRate: number,
  workHoursPerDay: number,
): number {
  switch (payType) {
    case "MONTHLY":
      return baseRate / WORKDAYS_PER_MONTH / workHoursPerDay;
    case "DAILY":
      return baseRate / workHoursPerDay;
    case "HOURLY":
      return baseRate;
  }
}

export function computeEarnings(input: EarningsInput): EarningsResult {
  const { payType, baseRate, workHoursPerDay, hours } = input;
  const hourlyRate = hourlyRateOf(payType, baseRate, workHoursPerDay);

  let basicPay: number;
  switch (payType) {
    case "MONTHLY":
      basicPay = baseRate / 2;
      break;
    case "DAILY":
      basicPay = hours.daysWorked * baseRate;
      break;
    case "HOURLY":
      basicPay = hours.regularHours * baseRate;
      break;
  }

  const overtimePay = hours.overtimeHours * hourlyRate * OVERTIME_MULTIPLIER;
  // Night differential on overtime hours is 10% of the OT rate (Art. 86),
  // i.e. 12.5% of the base hourly rate, not a flat 10% for all night hours.
  const nightRegularPay =
    (hours.nightDiffHours - hours.nightOvertimeHours) * hourlyRate * NIGHT_DIFF_RATE;
  const nightOvertimePay =
    hours.nightOvertimeHours * hourlyRate * OVERTIME_MULTIPLIER * NIGHT_DIFF_RATE;
  const nightDiffPay = nightRegularPay + nightOvertimePay;

  return {
    basicPay: round2(basicPay),
    overtimePay: round2(overtimePay),
    nightDiffPay: round2(nightDiffPay),
    gross: round2(basicPay + overtimePay + nightDiffPay),
    hourlyRate,
  };
}
