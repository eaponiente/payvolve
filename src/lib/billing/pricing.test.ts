import { describe, expect, it } from "vitest";
import { computeBill } from "./pricing";

describe("computeBill — PondoFlow subscription pricing", () => {
  it("charges only the base fee with no employees", () => {
    const b = computeBill(0, false);
    expect(b.total).toBe(999);
    expect(b.perEmployeeTotal).toBe(0);
  });

  it("adds ₱100 per active employee (4 employees → ₱1,399)", () => {
    const b = computeBill(4, false);
    expect(b.base).toBe(999);
    expect(b.perEmployeeTotal).toBe(400);
    expect(b.ewaTotal).toBe(0);
    expect(b.total).toBe(1_399);
  });

  it("adds the EWA add-on at ₱100 per employee (4 employees → ₱1,799)", () => {
    const b = computeBill(4, true);
    expect(b.ewaTotal).toBe(400);
    expect(b.total).toBe(1_799);
    expect(b.lines.some((l) => l.label === "Earned Wage Access")).toBe(true);
  });

  it("omits the EWA line when the add-on is off", () => {
    const b = computeBill(10, false);
    expect(b.lines.some((l) => l.label === "Earned Wage Access")).toBe(false);
    expect(b.total).toBe(1_999); // 999 + 1000
  });

  it("floors and clamps a nonsensical headcount", () => {
    expect(computeBill(-3, false).total).toBe(999);
    expect(computeBill(2.9, false).perEmployeeTotal).toBe(200);
  });
});
