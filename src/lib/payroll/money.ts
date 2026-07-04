/**
 * Round to 2 decimal places, half up — the convention for PHP payroll amounts.
 * Stabilizes at 6 decimal places first so binary float drift (e.g. 156.825
 * stored as 156.82499999999998) doesn't flip the half-up result.
 */
export function round2(n: number): number {
  const stabilized = Math.round(n * 1e6) / 1e4;
  return Math.round(stabilized) / 100;
}

export function phpFormat(n: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(n);
}
