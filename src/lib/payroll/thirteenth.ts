import { round2 } from "./money";

/**
 * 13th-month pay (PD 851): 1/12 of the total basic salary earned within the
 * calendar year. Tax-exempt up to ₱90,000/year (handled at run level — the MVP
 * assumes amounts stay under the cap and applies no withholding).
 */
export function computeThirteenthMonth(totalBasicEarnedThisYear: number): number {
  return round2(totalBasicEarnedThisYear / 12);
}
