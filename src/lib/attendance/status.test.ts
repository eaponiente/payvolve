import { describe, expect, it } from "vitest";
import { attendanceStatus } from "./status";

const at = (iso: string) => new Date(iso);

describe("attendanceStatus", () => {
  it("flags a clean 8h day shift as neither late/OT/undertime", () => {
    const s = attendanceStatus(at("2026-06-16T09:00"), at("2026-06-16T17:00"), 8);
    expect(s.late).toBe(false);
    expect(s.overtime).toBe(false);
    expect(s.undertime).toBe(false);
    expect(s.hours).toBe(8);
  });

  it("flags a late morning arrival past the 15-min grace", () => {
    const s = attendanceStatus(at("2026-06-16T09:40"), at("2026-06-16T17:00"), 8);
    expect(s.late).toBe(true);
    expect(s.minutesLate).toBe(25); // 09:40 vs 09:15 grace
  });

  it("does not flag a 09:10 arrival (within grace)", () => {
    const s = attendanceStatus(at("2026-06-16T09:10"), at("2026-06-16T17:00"), 8);
    expect(s.late).toBe(false);
  });

  it("flags overtime beyond the standard day", () => {
    const s = attendanceStatus(at("2026-06-16T09:00"), at("2026-06-16T20:00"), 8);
    expect(s.overtime).toBe(true);
    expect(s.hours).toBe(11);
  });

  it("flags undertime for a short day", () => {
    const s = attendanceStatus(at("2026-06-16T09:00"), at("2026-06-16T13:00"), 8);
    expect(s.undertime).toBe(true);
    expect(s.hours).toBe(4);
  });

  it("flags night work but not lateness for an evening close", () => {
    const s = attendanceStatus(at("2026-06-16T14:00"), at("2026-06-16T23:00"), 8);
    expect(s.night).toBe(true); // 22:00–23:00 overlaps the night window
    expect(s.late).toBe(false); // afternoon start is never "late"
    expect(s.overtime).toBe(true); // 9h
  });

  it("marks an open (not clocked-out) entry", () => {
    const s = attendanceStatus(at("2026-06-16T09:00"), null, 8);
    expect(s.open).toBe(true);
  });
});
