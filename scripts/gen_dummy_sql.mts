/**
 * Generates dummy-data-edgar.sql — 4 employees + one week (Mon–Sat) of time
 * entries and shifts for edgar.poniente@gmail.com's company. Pure string
 * generation (no DB). Times are naive wall-clock (TIMESTAMP(3), stored as UTC
 * by Prisma). Attendance mirrors src/lib/attendance/sample.ts patterns.
 */
import { writeFileSync } from "node:fs";

const EMAIL = "edgar.poniente@gmail.com";
// This week's working days (Mon–Sat); Sunday 07-12 is closed.
const DAYS = ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11"];

type Emp = {
  id: string; firstName: string; lastName: string; position: string;
  payType: "MONTHLY" | "DAILY" | "HOURLY"; baseRate: number;
  tin: string; sss: string; phic: string; hdmf: string;
  shiftStart: [number, number]; shiftEnd: [number, number]; // planned schedule
};

const EMPLOYEES: Emp[] = [
  { id: "emp-dummy-01", firstName: "Maria", lastName: "Santos", position: "Manager", payType: "MONTHLY", baseRate: 35000, tin: "123-456-789-000", sss: "34-1234567-8", phic: "12-345678901-2", hdmf: "1234-5678-9012", shiftStart: [9, 0], shiftEnd: [17, 0] },
  { id: "emp-dummy-02", firstName: "Ramon", lastName: "Dela Cruz", position: "Head Cook", payType: "DAILY", baseRate: 950, tin: "234-567-890-000", sss: "34-2345678-9", phic: "12-456789012-3", hdmf: "2345-6789-0123", shiftStart: [14, 0], shiftEnd: [23, 0] },
  { id: "emp-dummy-03", firstName: "Jenny", lastName: "Reyes", position: "Server", payType: "DAILY", baseRate: 750, tin: "345-678-901-000", sss: "34-3456789-0", phic: "12-567890123-4", hdmf: "3456-7890-1234", shiftStart: [9, 0], shiftEnd: [17, 0] },
  { id: "emp-dummy-04", firstName: "Paolo", lastName: "Aquino", position: "Barista", payType: "HOURLY", baseRate: 95, tin: "456-789-012-000", sss: "34-4567890-1", phic: "12-678901234-5", hdmf: "4567-8901-2345", shiftStart: [9, 0], shiftEnd: [15, 0] },
];

// Actual clock in/out per employee index and k-th working day (k = 0..5).
// null = absent (no time entry). Mirrors sample.ts planFor().
type Plan = { sh: number; sm: number; eh: number; em: number } | null;
function planFor(idx: number, k: number): Plan {
  switch (idx) {
    case 0: return k === 3 ? { sh: 9, sm: 40, eh: 17, em: 0 } : { sh: 9, sm: 0, eh: 17, em: 0 };
    case 1: return k === 5 ? null : { sh: 14, sm: 0, eh: 23, em: 0 };
    case 2:
      if (k === 2) return null;
      if (k === 4) return { sh: 9, sm: 0, eh: 13, em: 0 };
      if (k === 1) return { sh: 9, sm: 50, eh: 17, em: 10 };
      return { sh: 9, sm: 0, eh: 17, em: 0 };
    default:
      if (k === 1) return null;
      if (k === 3) return { sh: 9, sm: 0, eh: 20, em: 0 };
      if (k === 5) return { sh: 10, sm: 15, eh: 17, em: 0 };
      return { sh: 9, sm: 0, eh: 15, em: 0 };
  }
}

const p2 = (n: number) => String(n).padStart(2, "0");
const ts = (day: string, h: number, m: number) => `TIMESTAMP '${day} ${p2(h)}:${p2(m)}:00'`;
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const empValues = EMPLOYEES.map(
  (e) =>
    `    (${q(e.id)}, cid, ${q(e.firstName)}, ${q(e.lastName)}, ${q(e.position)}, TIMESTAMP '2025-01-15 00:00:00', true, '${e.payType}', ${e.baseRate}, ${q(e.tin)}, ${q(e.sss)}, ${q(e.phic)}, ${q(e.hdmf)}, now(), now())`,
).join(",\n");

const teValues: string[] = [];
const shiftValues: string[] = [];
EMPLOYEES.forEach((e, idx) => {
  DAYS.forEach((day, k) => {
    const plan = planFor(idx, k);
    if (plan) {
      teValues.push(
        `    (${q(`te-${e.id}-${k}`)}, ${q(e.id)}, ${ts(day, plan.sh, plan.sm)}, ${ts(day, plan.eh, plan.em)}, 'CLOCK', now(), now())`,
      );
    }
    // A planned shift exists every working day, even on absences.
    shiftValues.push(
      `    (${q(`sh-${e.id}-${k}`)}, cid, ${q(e.id)}, ${ts(day, e.shiftStart[0], e.shiftStart[1])}, ${ts(day, e.shiftEnd[0], e.shiftEnd[1])}, ${q(e.position)}, '', now(), now())`,
    );
  });
});

const empIds = EMPLOYEES.map((e) => q(e.id)).join(", ");

const sql = `-- Dummy data for ${EMAIL}: 4 employees + one week (Mon 2026-07-06 .. Sat 2026-07-11)
-- of time entries and shifts. Idempotent: re-running replaces the same rows.
-- Government IDs are plaintext here; the app's decryptField() passes legacy
-- plaintext through unchanged, so they display fine. New edits via the UI will
-- re-save them encrypted.
DO $$
DECLARE
  cid TEXT;
BEGIN
  SELECT "companyId" INTO cid FROM "User" WHERE email = ${q(EMAIL)} LIMIT 1;
  IF cid IS NULL THEN
    RAISE EXCEPTION 'No company found for user %', ${q(EMAIL)};
  END IF;

  -- Clean any previous run (TimeEntry + Shift cascade off Employee).
  DELETE FROM "Employee" WHERE id IN (${empIds});

  INSERT INTO "Employee"
    (id, "companyId", "firstName", "lastName", "position", "hireDate", "active", "payType", "baseRate", "tin", "sssNumber", "philhealthNumber", "pagibigNumber", "createdAt", "updatedAt")
  VALUES
${empValues};

  INSERT INTO "TimeEntry"
    (id, "employeeId", "clockIn", "clockOut", "source", "createdAt", "updatedAt")
  VALUES
${teValues.join(",\n")};

  INSERT INTO "Shift"
    (id, "companyId", "employeeId", "startsAt", "endsAt", "role", "notes", "createdAt", "updatedAt")
  VALUES
${shiftValues.join(",\n")};
END $$;
`;

writeFileSync("dummy-data-edgar.sql", sql);
console.log(`Wrote dummy-data-edgar.sql: ${EMPLOYEES.length} employees, ${teValues.length} time entries, ${shiftValues.length} shifts.`);
