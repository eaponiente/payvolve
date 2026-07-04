import { prisma } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/tenant";
import { clockIn, clockOut, deleteEntry } from "@/lib/actions/time-actions";
import { semiMonthlyPeriodFor, formatPeriod } from "@/lib/payroll/period";
import { getEntitlement } from "@/lib/billing/subscription";
import { attendanceStatus } from "@/lib/attendance/status";
import { Badge, Button, Card, PageHeader, Td, Th } from "@/components/ui";
import { ManualEntryForm } from "@/components/manual-entry-form";

const timeFmt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function hoursBetween(a: Date, b: Date): string {
  return `${(Math.round(((b.getTime() - a.getTime()) / 3_600_000) * 100) / 100).toLocaleString("en-PH")} h`;
}

/** Small colored chips describing an entry: late / overtime / undertime / night. */
function StatusChips({
  clockIn,
  clockOut,
  workHoursPerDay,
}: {
  clockIn: Date;
  clockOut: Date | null;
  workHoursPerDay: number;
}) {
  const s = attendanceStatus(clockIn, clockOut, workHoursPerDay);
  if (s.open) return <Badge tone="emerald">Open</Badge>;
  const chips: { label: string; tone: "amber" | "emerald" | "zinc" }[] = [];
  if (s.late) chips.push({ label: `Late ${s.minutesLate}m`, tone: "amber" });
  if (s.overtime) chips.push({ label: "OT", tone: "emerald" });
  if (s.undertime) chips.push({ label: "Undertime", tone: "amber" });
  if (s.night) chips.push({ label: "Night", tone: "zinc" });
  if (chips.length === 0) chips.push({ label: "On time", tone: "zinc" });
  return (
    <span className="flex flex-wrap gap-1">
      {chips.map((c) => (
        <Badge key={c.label} tone={c.tone}>
          {c.label}
        </Badge>
      ))}
    </span>
  );
}

/** Non-Sunday days from `start` through the earlier of `end`/today (inclusive). */
function elapsedWorkingDays(start: Date, end: Date): number {
  const now = new Date();
  const stop = now < end ? now : end;
  let count = 0;
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  while (d <= stop) {
    if (d.getDay() !== 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default async function TimePage() {
  const user = await requireUser();
  const period = semiMonthlyPeriodFor(new Date());
  const { entitled } = await getEntitlement(user.companyId);
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { workHoursPerDay: true },
  });
  const workHoursPerDay = company?.workHoursPerDay ?? 8;

  if (!isAdmin(user)) {
    // ---- Employee view: clock in/out + own entries this cutoff
    if (!user.employeeId) {
      return <p className="text-zinc-500">No employee profile linked to your account.</p>;
    }
    const entries = await prisma.timeEntry.findMany({
      where: {
        employeeId: user.employeeId,
        clockIn: { gte: period.start, lte: period.end },
      },
      orderBy: { clockIn: "desc" },
    });
    const open = entries.find((e) => !e.clockOut);

    return (
      <div className="mx-auto max-w-lg">
        <PageHeader
          title="Time clock"
          subtitle={`Cutoff: ${formatPeriod(period.start, period.end)}`}
        />
        <Card className="p-8 text-center">
          {!entitled ? (
            <>
              <p className="mb-2 text-sm font-medium text-amber-700">
                Time clock paused
              </p>
              <p className="text-sm text-zinc-500">
                Your company&apos;s subscription is inactive, so clocking in and
                out is temporarily disabled. Your past entries are still shown
                below.
              </p>
            </>
          ) : open ? (
            <>
              <p className="mb-1 text-sm text-zinc-500">Clocked in since</p>
              <p className="mb-6 text-2xl font-semibold">{timeFmt.format(open.clockIn)}</p>
              <form action={clockOut}>
                <Button variant="danger" className="w-full py-4 text-base">
                  Clock out
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="mb-6 text-sm text-zinc-500">You are not clocked in.</p>
              <form action={clockIn}>
                <Button className="w-full py-4 text-base">Clock in</Button>
              </form>
            </>
          )}
        </Card>

        <Card className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-200">
              <tr>
                <Th>In</Th>
                <Th>Out</Th>
                <Th className="text-right">Hours</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <Td>{timeFmt.format(e.clockIn)}</Td>
                  <Td>{e.clockOut ? timeFmt.format(e.clockOut) : <Badge tone="emerald">Open</Badge>}</Td>
                  <Td className="text-right tabular-nums">
                    {e.clockOut ? hoursBetween(e.clockIn, e.clockOut) : "—"}
                  </Td>
                  <Td>
                    <StatusChips
                      clockIn={e.clockIn}
                      clockOut={e.clockOut}
                      workHoursPerDay={workHoursPerDay}
                    />
                  </Td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-zinc-500">
                    No entries this cutoff yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  // ---- Admin view: full timesheet for the current cutoff
  const [employees, entries] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId: user.companyId, active: true },
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.timeEntry.findMany({
      where: {
        employee: { companyId: user.companyId },
        clockIn: { gte: period.start, lte: period.end },
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { clockIn: "desc" },
    }),
  ]);

  // Per-employee attendance summary for the elapsed part of this cutoff.
  const expectedDays = elapsedWorkingDays(period.start, period.end);
  const summary = employees.map((emp) => {
    const own = entries.filter((e) => e.employeeId === emp.id);
    const presentDays = new Set(own.map((e) => dayKey(e.clockIn))).size;
    let late = 0;
    let hours = 0;
    for (const e of own) {
      const s = attendanceStatus(e.clockIn, e.clockOut, workHoursPerDay);
      if (s.late) late++;
      hours += s.hours;
    }
    return {
      emp,
      presentDays,
      absentDays: Math.max(0, expectedDays - presentDays),
      late,
      hours: Math.round(hours * 100) / 100,
    };
  });

  return (
    <>
      <PageHeader
        title="Timesheet"
        subtitle={`Cutoff: ${formatPeriod(period.start, period.end)} · ${expectedDays} working day(s) so far`}
      />

      {entitled && (
        <ManualEntryForm
          employees={employees.map((e) => ({
            id: e.id,
            name: `${e.lastName}, ${e.firstName}`,
          }))}
        />
      )}

      {/* Attendance summary */}
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Employee</Th>
              <Th className="text-right">Present</Th>
              <Th className="text-right">Absent</Th>
              <Th className="text-right">Late</Th>
              <Th className="text-right">Hours</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {summary.map((r) => (
              <tr key={r.emp.id} className="hover:bg-zinc-50">
                <Td className="font-medium">
                  {r.emp.lastName}, {r.emp.firstName}
                </Td>
                <Td className="text-right tabular-nums">
                  {r.presentDays}/{expectedDays}
                </Td>
                <Td className="text-right">
                  {r.absentDays > 0 ? (
                    <Badge tone="amber">{r.absentDays}</Badge>
                  ) : (
                    <span className="text-zinc-400">0</span>
                  )}
                </Td>
                <Td className="text-right">
                  {r.late > 0 ? (
                    <Badge tone="amber">{r.late}</Badge>
                  ) : (
                    <span className="text-zinc-400">0</span>
                  )}
                </Td>
                <Td className="text-right tabular-nums">{r.hours} h</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Employee</Th>
              <Th>In</Th>
              <Th>Out</Th>
              <Th className="text-right">Hours</Th>
              <Th>Status</Th>
              <Th>Source</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-zinc-50">
                <Td className="font-medium">
                  {e.employee.lastName}, {e.employee.firstName}
                </Td>
                <Td>{timeFmt.format(e.clockIn)}</Td>
                <Td>{e.clockOut ? timeFmt.format(e.clockOut) : <Badge tone="emerald">Open</Badge>}</Td>
                <Td className="text-right tabular-nums">
                  {e.clockOut ? hoursBetween(e.clockIn, e.clockOut) : "—"}
                </Td>
                <Td>
                  <StatusChips
                    clockIn={e.clockIn}
                    clockOut={e.clockOut}
                    workHoursPerDay={workHoursPerDay}
                  />
                </Td>
                <Td>
                  <Badge tone={e.source === "MANUAL" ? "amber" : "zinc"}>
                    {e.source === "MANUAL" ? "Manual" : "Clock"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  {entitled && (
                    <form action={deleteEntry.bind(null, e.id)}>
                      <button className="text-sm text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <Td colSpan={7} className="py-8 text-center text-zinc-500">
                  No time entries this cutoff yet.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
