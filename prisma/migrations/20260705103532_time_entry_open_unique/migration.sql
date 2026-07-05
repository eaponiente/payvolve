-- Prevent two open (not-yet-clocked-out) time entries for the same employee.
-- Prisma's schema DSL doesn't support partial unique indexes, so this is
-- hand-written raw SQL rather than DSL-generated.
CREATE UNIQUE INDEX "TimeEntry_employeeId_open_key" ON "TimeEntry" ("employeeId") WHERE "clockOut" IS NULL;
