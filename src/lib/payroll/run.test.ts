import { describe, expect, it } from "vitest";
import { computeSemiMonthlyPayslip, computeThirteenthMonthPayslip } from "./run";
import { computeThirteenthMonth } from "./thirteenth";

const d = (iso: string) => new Date(iso);

/** 8h day shifts on the given ISO dates. */
function dayShifts(dates: string[]) {
  return dates.map((date) => ({
    clockIn: d(`${date}T09:00`),
    clockOut: d(`${date}T17:00`),
  }));
}

describe("computeSemiMonthlyPayslip — known answers", () => {
  it("₱25,000/month employee, plain period", () => {
    const slip = computeSemiMonthlyPayslip(
      {
        payType: "MONTHLY",
        baseRate: 25_000,
        timeEntries: dayShifts([
          "2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05",
          "2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12",
        ]),
      },
      8,
    );

    expect(slip.gross).toBe(12_500);
    // Monthly: SSS 1,250 / PhilHealth 625 / Pag-IBIG 200 → half per cutoff
    const byLabel = Object.fromEntries(slip.deductions.map((x) => [x.label, x.amount]));
    expect(byLabel["SSS"]).toBe(625);
    expect(byLabel["PhilHealth"]).toBe(312.5);
    expect(byLabel["Pag-IBIG"]).toBe(100);
    // Taxable 11,462.50 → 15% × (11,462.50 − 10,417) = 156.83
    expect(byLabel["Withholding tax"]).toBe(156.83);
    expect(slip.totalDeductions).toBe(1_194.33);
    expect(slip.net).toBe(11_305.67);
  });

  it("adds overtime and night differential for monthly staff", () => {
    const slip = computeSemiMonthlyPayslip(
      {
        payType: "MONTHLY",
        baseRate: 20_800, // hourly = 20,800 / 26 / 8 = 100
        timeEntries: [
          // 10h shift ending at midnight: 2h OT, 2h night diff (22:00–24:00)
          { clockIn: d("2026-06-01T14:00"), clockOut: d("2026-06-02T00:00") },
        ],
      },
      8,
    );
    const byLabel = Object.fromEntries(slip.earnings.map((x) => [x.label, x.amount]));
    expect(byLabel["Basic pay"]).toBe(10_400);
    expect(byLabel["Overtime (125%)"]).toBe(250); // 2h × 100 × 1.25
    // These 2h are also overtime, so night diff is 10% of the OT rate:
    // 2h × 100 × 1.25 × 0.10 = 25 (not a flat 2h × 100 × 0.10 = 20).
    expect(byLabel["Night differential (10%)"]).toBe(25);
    expect(slip.gross).toBe(10_675);
  });

  it("pays daily-rate employees per day worked, min-wage-ish with no tax", () => {
    const slip = computeSemiMonthlyPayslip(
      {
        payType: "DAILY",
        baseRate: 645, // NCR-ish minimum wage
        timeEntries: dayShifts(["2026-06-01", "2026-06-02", "2026-06-03"]),
      },
      8,
    );
    expect(slip.gross).toBe(1_935);
    // Monthly basic est. 3,870 → SSS MSC floor 5,000 → EE 250/mo → 125 per cutoff
    const byLabel = Object.fromEntries(slip.deductions.map((x) => [x.label, x.amount]));
    expect(byLabel["SSS"]).toBe(125);
    expect(byLabel["PhilHealth"]).toBe(125); // floor 10,000 → 250/mo
    expect(byLabel["Withholding tax"]).toBeUndefined(); // below 10,417
  });
});

describe("13th month pay", () => {
  it("is 1/12 of basic salary earned in the year", () => {
    expect(computeThirteenthMonth(300_000)).toBe(25_000);
  });

  it("produces a deduction-free payslip", () => {
    const slip = computeThirteenthMonthPayslip(25_000);
    expect(slip.gross).toBe(25_000);
    expect(slip.net).toBe(25_000);
    expect(slip.deductions).toHaveLength(0);
  });
});
