import { describe, expect, it } from "vitest";
import {
  sssEmployeeMonthly,
  sssEmployerMonthly,
  sssMonthlySalaryCredit,
} from "./sss";
import {
  philhealthEmployeeMonthly,
  philhealthEmployerMonthly,
} from "./philhealth";
import { pagibigEmployeeMonthly, pagibigEmployerMonthly } from "./pagibig";
import { birWithholdingSemiMonthly } from "./bir";

describe("SSS 2025 contribution table", () => {
  it("maps salaries to MSC brackets (nearest ₱500)", () => {
    expect(sssMonthlySalaryCredit(4_000)).toBe(5_000); // floor
    expect(sssMonthlySalaryCredit(5_249)).toBe(5_000);
    expect(sssMonthlySalaryCredit(5_250)).toBe(5_500);
    expect(sssMonthlySalaryCredit(5_749)).toBe(5_500);
    expect(sssMonthlySalaryCredit(25_000)).toBe(25_000);
    expect(sssMonthlySalaryCredit(34_749)).toBe(34_500);
    expect(sssMonthlySalaryCredit(34_750)).toBe(35_000);
    expect(sssMonthlySalaryCredit(100_000)).toBe(35_000); // ceiling
  });

  it("computes 5% employee share of MSC", () => {
    expect(sssEmployeeMonthly(25_000)).toBe(1_250);
    expect(sssEmployeeMonthly(4_000)).toBe(250); // MSC floor 5,000
    expect(sssEmployeeMonthly(50_000)).toBe(1_750); // MSC ceiling 35,000
  });

  it("computes 10% employer share of MSC", () => {
    expect(sssEmployerMonthly(25_000)).toBe(2_500);
  });
});

describe("PhilHealth premium (5%, 2024+ schedule)", () => {
  it("splits 5% premium equally with floor and ceiling", () => {
    expect(philhealthEmployeeMonthly(25_000)).toBe(625);
    expect(philhealthEmployeeMonthly(8_000)).toBe(250); // floor 10,000 → 500/2
    expect(philhealthEmployeeMonthly(150_000)).toBe(2_500); // ceiling 100,000
    expect(philhealthEmployerMonthly(25_000)).toBe(625);
  });
});

describe("Pag-IBIG contribution (2024+ ₱10,000 cap)", () => {
  it("computes 2% of capped salary, max ₱200", () => {
    expect(pagibigEmployeeMonthly(25_000)).toBe(200);
    expect(pagibigEmployeeMonthly(8_000)).toBe(160);
    expect(pagibigEmployeeMonthly(1_500)).toBe(15); // 1% tier
    expect(pagibigEmployerMonthly(8_000)).toBe(160);
  });
});

describe("BIR semi-monthly withholding (2023+ table)", () => {
  it("exempts ₱10,417 and below", () => {
    expect(birWithholdingSemiMonthly(10_417)).toBe(0);
    expect(birWithholdingSemiMonthly(5_000)).toBe(0);
    expect(birWithholdingSemiMonthly(0)).toBe(0);
  });

  it("applies 15% over ₱10,417 in bracket 2", () => {
    // ₱25,000/month employee: taxable 12,500 − 625 − 312.50 − 100 = 11,462.50
    expect(birWithholdingSemiMonthly(11_462.5)).toBe(156.83);
  });

  it("hits bracket boundaries exactly", () => {
    expect(birWithholdingSemiMonthly(16_667)).toBe(937.5);
    expect(birWithholdingSemiMonthly(33_333)).toBe(4_270.7);
    expect(birWithholdingSemiMonthly(83_333)).toBe(16_770.7);
    expect(birWithholdingSemiMonthly(333_333)).toBe(91_770.7);
  });

  it("computes mid-bracket amounts", () => {
    // 20,000 → 937.50 + 20% × (20,000 − 16,667) = 937.50 + 666.60 = 1,604.10
    expect(birWithholdingSemiMonthly(20_000)).toBe(1_604.1);
  });
});
