import { prisma } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/tenant";
import { clockIn, clockOut, deleteEntry } from "@/lib/actions/time-actions";
import { semiMonthlyPeriodFor, formatPeriod } from "@/lib/payroll/period";
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

export default async function TimePage() {
  const user = await requireUser();
  const period = semiMonthlyPeriodFor(new Date());

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
          {open ? (
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
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <Td colSpan={3} className="py-8 text-center text-zinc-500">
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

  return (
    <>
      <PageHeader
        title="Timesheet"
        subtitle={`Cutoff: ${formatPeriod(period.start, period.end)}`}
      />

      <ManualEntryForm
        employees={employees.map((e) => ({
          id: e.id,
          name: `${e.lastName}, ${e.firstName}`,
        }))}
      />

      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Employee</Th>
              <Th>In</Th>
              <Th>Out</Th>
              <Th className="text-right">Hours</Th>
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
                  <Badge tone={e.source === "MANUAL" ? "amber" : "zinc"}>
                    {e.source === "MANUAL" ? "Manual" : "Clock"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <form action={deleteEntry.bind(null, e.id)}>
                    <button className="text-sm text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <Td colSpan={6} className="py-8 text-center text-zinc-500">
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
