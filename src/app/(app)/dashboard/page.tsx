import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/tenant";
import { phpFormat } from "@/lib/payroll/money";
import { formatPeriod, semiMonthlyPeriodFor } from "@/lib/payroll/period";
import { formatShiftTime, weekOf } from "@/lib/schedule/week";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";

const shiftDayFmt = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const period = semiMonthlyPeriodFor(new Date());

  if (!isAdmin(user)) {
    // ---- Employee dashboard
    const [openEntry, latestPayslip, nextShift] = await Promise.all([
      user.employeeId
        ? prisma.timeEntry.findFirst({
            where: { employeeId: user.employeeId, clockOut: null },
          })
        : null,
      user.employeeId
        ? prisma.payslip.findFirst({
            where: {
              employeeId: user.employeeId,
              payrollRun: { status: "FINALIZED" },
            },
            include: { payrollRun: true },
            orderBy: { payrollRun: { periodStart: "desc" } },
          })
        : null,
      user.employeeId
        ? prisma.shift.findFirst({
            where: { employeeId: user.employeeId, endsAt: { gte: new Date() } },
            orderBy: { startsAt: "asc" },
          })
        : null,
    ]);

    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Hello!" subtitle={formatPeriod(period.start, period.end)} />
        <div className="space-y-4">
          <Card className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm text-zinc-500">Next shift</div>
              <div className="mt-1 font-medium">
                {nextShift ? (
                  <>
                    {shiftDayFmt.format(nextShift.startsAt)} ·{" "}
                    {formatShiftTime(nextShift.startsAt, nextShift.endsAt)}
                    {nextShift.role && (
                      <span className="ml-1 text-sm text-zinc-500">
                        ({nextShift.role})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-zinc-500">Nothing scheduled</span>
                )}
              </div>
            </div>
            <ButtonLink href="/schedule" variant="secondary">
              Schedule
            </ButtonLink>
          </Card>
          <Card className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm text-zinc-500">Time clock</div>
              <div className="mt-1 font-medium">
                {openEntry ? (
                  <Badge tone="emerald">Clocked in</Badge>
                ) : (
                  <Badge>Clocked out</Badge>
                )}
              </div>
            </div>
            <ButtonLink href="/time">Open time clock</ButtonLink>
          </Card>
          <Card className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm text-zinc-500">Latest payslip</div>
              <div className="mt-1 text-xl font-semibold">
                {latestPayslip ? phpFormat(Number(latestPayslip.net)) : "—"}
              </div>
              {latestPayslip && (
                <div className="text-xs text-zinc-400">
                  {formatPeriod(
                    latestPayslip.payrollRun.periodStart,
                    latestPayslip.payrollRun.periodEnd,
                  )}
                </div>
              )}
            </div>
            <ButtonLink href="/payslips" variant="secondary">
              View all
            </ButtonLink>
          </Card>
        </div>
      </div>
    );
  }

  // ---- Admin dashboard
  const thisWeek = weekOf(new Date());
  const [activeCount, clockedInCount, lastRun, draftCount, shiftsThisWeek] =
    await Promise.all([
      prisma.employee.count({ where: { companyId: user.companyId, active: true } }),
      prisma.timeEntry.count({
        where: { employee: { companyId: user.companyId }, clockOut: null },
      }),
      prisma.payrollRun.findFirst({
        where: { companyId: user.companyId },
        orderBy: { periodStart: "desc" },
        include: { payslips: { select: { net: true } } },
      }),
      prisma.payrollRun.count({
        where: { companyId: user.companyId, status: "DRAFT" },
      }),
      prisma.shift.count({
        where: {
          companyId: user.companyId,
          startsAt: { gte: thisWeek.start, lte: thisWeek.end },
        },
      }),
    ]);

  const lastRunNet = lastRun
    ? lastRun.payslips.reduce((s, p) => s + Number(p.net), 0)
    : null;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Current cutoff: ${formatPeriod(period.start, period.end)}`}
        action={<ButtonLink href="/payroll/new">New payroll run</ButtonLink>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active employees" value={String(activeCount)} />
        <Stat label="Clocked in now" value={String(clockedInCount)} />
        <Stat
          label="Last run net total"
          value={lastRunNet === null ? "—" : phpFormat(lastRunNet)}
          hint={
            lastRun
              ? `${formatPeriod(lastRun.periodStart, lastRun.periodEnd)} · ${lastRun.status.toLowerCase()}`
              : "No runs yet"
          }
        />
        <Stat
          label="Draft runs"
          value={String(draftCount)}
          hint={draftCount > 0 ? "Awaiting review" : undefined}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/employees", title: "Employees", desc: "Manage crew, rates, and government IDs" },
          {
            href: "/schedule",
            title: "Schedule",
            desc: `${shiftsThisWeek} shift(s) scheduled this week`,
          },
          { href: "/time", title: "Timesheet", desc: "Review attendance for this cutoff" },
          { href: "/reports", title: "Reports", desc: "Export payroll registers as CSV" },
        ].map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full p-5 transition-colors hover:border-emerald-300">
              <div className="font-semibold">{card.title}</div>
              <div className="mt-1 text-sm text-zinc-500">{card.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
