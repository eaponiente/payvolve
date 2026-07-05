import { describe, expect, it } from "vitest";
import { nightOverlapHours, summarizeHours } from "./hours";

const d = (iso: string) => new Date(iso);

describe("nightOverlapHours", () => {
  it("is zero for a day shift", () => {
    expect(nightOverlapHours(d("2026-06-01T09:00"), d("2026-06-01T17:00"))).toBe(0);
  });

  it("counts hours after 22:00", () => {
    expect(nightOverlapHours(d("2026-06-01T18:00"), d("2026-06-02T00:00"))).toBe(2);
  });

  it("counts a shift crossing midnight into the morning window", () => {
    // 20:00 → 04:00: night hours are 22:00–04:00 = 6
    expect(nightOverlapHours(d("2026-06-01T20:00"), d("2026-06-02T04:00"))).toBe(6);
  });

  it("counts early-morning work before 06:00", () => {
    expect(nightOverlapHours(d("2026-06-01T04:00"), d("2026-06-01T08:00"))).toBe(2);
  });
});

describe("summarizeHours", () => {
  it("splits regular and overtime per day", () => {
    const s = summarizeHours(
      [
        { clockIn: d("2026-06-01T09:00"), clockOut: d("2026-06-01T19:00") }, // 10h
        { clockIn: d("2026-06-02T09:00"), clockOut: d("2026-06-02T17:00") }, // 8h
      ],
      8,
    );
    expect(s.regularHours).toBe(16);
    expect(s.overtimeHours).toBe(2);
    expect(s.daysWorked).toBe(2);
    expect(s.nightDiffHours).toBe(0);
  });

  it("merges split shifts on the same day", () => {
    const s = summarizeHours(
      [
        { clockIn: d("2026-06-01T10:00"), clockOut: d("2026-06-01T14:00") },
        { clockIn: d("2026-06-01T17:00"), clockOut: d("2026-06-01T23:00") },
      ],
      8,
    );
    expect(s.daysWorked).toBe(1);
    expect(s.regularHours).toBe(8);
    expect(s.overtimeHours).toBe(2);
    expect(s.nightDiffHours).toBe(1); // 22:00–23:00
  });

  it("ignores open (not clocked out) entries", () => {
    const s = summarizeHours([{ clockIn: d("2026-06-01T09:00"), clockOut: null }], 8);
    expect(s.daysWorked).toBe(0);
    expect(s.regularHours).toBe(0);
  });

  it("reports zero night-overtime overlap when there is no overtime", () => {
    const s = summarizeHours(
      [{ clockIn: d("2026-06-01T18:00"), clockOut: d("2026-06-02T00:00") }], // 6h, all regular
      8,
    );
    expect(s.overtimeHours).toBe(0);
    expect(s.nightDiffHours).toBe(2); // 22:00–00:00
    expect(s.nightOvertimeHours).toBe(0);
  });

  it("counts night hours that fall within overtime as night-overtime", () => {
    // 14:00 → 00:00 (10h): 8h regular, 2h OT (22:00–00:00), which is also
    // entirely within the night window — fully overlapping.
    const s = summarizeHours(
      [{ clockIn: d("2026-06-01T14:00"), clockOut: d("2026-06-02T00:00") }],
      8,
    );
    expect(s.overtimeHours).toBe(2);
    expect(s.nightDiffHours).toBe(2);
    expect(s.nightOvertimeHours).toBe(2);
  });

  it("splits night hours between regular and overtime when only part overlaps", () => {
    // 12:00 → 23:00 (11h): 8h regular, 3h OT (20:00–23:00). Night hours are
    // 22:00–23:00 (1h), which falls entirely within the 3h OT window, but
    // OT itself (3h) exceeds the night hours (1h) — so all 1h of night is OT.
    const s = summarizeHours(
      [{ clockIn: d("2026-06-01T12:00"), clockOut: d("2026-06-01T23:00") }],
      8,
    );
    expect(s.overtimeHours).toBe(3);
    expect(s.nightDiffHours).toBe(1);
    expect(s.nightOvertimeHours).toBe(1);
  });
});
