import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/tenant";
import { deleteShift } from "@/lib/actions/schedule-actions";
import {
  addWeeks,
  formatShiftTime,
  formatWeekRange,
  parseDateKey,
  shiftDurationHours,
  toDateKey,
  weekOf,
} from "@/lib/schedule/week";
import { getEntitlement } from "@/lib/billing/subscription";
import { Badge, ButtonLink, Card, PageHeader, Td, Th } from "@/components/ui";
import { ShiftForm } from "@/components/shift-form";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayNumFmt = new Intl.DateTimeFormat("en-PH", { day: "numeric" });
const listFmt = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const user = await requireUser();
  const anchor = parseDateKey(weekParam) ?? new Date();
  const week = weekOf(anchor);
  const prevKey = toDateKey(addWeeks(week.start, -1));
  const nextKey = toDateKey(addWeeks(week.start, 1));

  const weekNav = (
    <div className="flex items-center gap-2">
      <ButtonLink href={`/schedule?week=${prevKey}`} variant="secondary">
        ← Prev
      </ButtonLink>
      <ButtonLink href="/schedule" variant="secondary">
        This week
      </ButtonLink>
      <ButtonLink href={`/schedule?week=${nextKey}`} variant="secondary">
        Next →
      </ButtonLink>
    </div>
  );

  // ---- Employee view: own upcoming shifts this week
  if (!isAdmin(user)) {
    if (!user.employeeId) {
      return <p className="text-zinc-500">No employee profile linked to your account.</p>;
    }
    const shifts = await prisma.shift.findMany({
      where: {
        employeeId: user.employeeId,
        startsAt: { gte: week.start, lte: week.end },
      },
      orderBy: { startsAt: "asc" },
    });

    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="My schedule" subtitle={formatWeekRange(week)} action={weekNav} />
        <Card className="divide-y divide-zinc-100">
          {shifts.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{listFmt.format(s.startsAt)}</div>
                <div className="text-sm text-zinc-500">
                  {formatShiftTime(s.startsAt, s.endsAt)}
                  {s.role && ` · ${s.role}`}
                </div>
              </div>
              <Badge tone="emerald">{shiftDurationHours(s.startsAt, s.endsAt)} h</Badge>
            </div>
          ))}
          {shifts.length === 0 && (
            <div className="p-8 text-center text-zinc-500">
              No shifts scheduled this week.
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ---- Admin view: weekly grid (crew × days)
  const { entitled } = await getEntitlement(user.companyId);
  const [employees, shifts] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId: user.companyId, active: true },
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.shift.findMany({
      where: { companyId: user.companyId, startsAt: { gte: week.start, lte: week.end } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const totalHours = shifts.reduce(
    (sum, s) => sum + shiftDurationHours(s.startsAt, s.endsAt),
    0,
  );

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={`${formatWeekRange(week)} · ${shifts.length} shift(s) · ${totalHours} h`}
        action={weekNav}
      />

      {entitled && (
        <div className="mb-6">
          <ShiftForm
            employees={employees.map((e) => ({
              id: e.id,
              name: `${e.lastName}, ${e.firstName}`,
            }))}
            weekDays={week.days.map((d, i) => ({
              value: toDateKey(d),
              label: `${DAY_LABELS[i]} ${dayNumFmt.format(d)}`,
            }))}
          />
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th className="w-40">Employee</Th>
              {week.days.map((d, i) => (
                <Th key={i} className="text-center">
                  {DAY_LABELS[i]} {dayNumFmt.format(d)}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {employees.map((emp) => (
              <tr key={emp.id} className="align-top">
                <Td className="font-medium">
                  {emp.lastName}, {emp.firstName}
                </Td>
                {week.days.map((day, i) => {
                  const cellShifts = shifts.filter(
                    (s) => s.employeeId === emp.id && sameDay(s.startsAt, day),
                  );
                  return (
                    <td key={i} className="px-2 py-2 align-top">
                      <div className="space-y-1">
                        {cellShifts.map((s) => (
                          <div
                            key={s.id}
                            className="group rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs"
                          >
                            <div className="font-medium text-emerald-900">
                              {formatShiftTime(s.startsAt, s.endsAt)}
                            </div>
                            {s.role && (
                              <div className="text-emerald-700">{s.role}</div>
                            )}
                            {entitled && (
                              <form action={deleteShift.bind(null, s.id)}>
                                <button className="mt-0.5 text-[11px] text-red-600 opacity-0 transition-opacity hover:underline group-hover:opacity-100">
                                  Remove
                                </button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <Td colSpan={8} className="py-10 text-center text-zinc-500">
                  No active employees to schedule.{" "}
                  <Link href="/employees" className="text-emerald-700 hover:underline">
                    Add employees
                  </Link>
                  .
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
