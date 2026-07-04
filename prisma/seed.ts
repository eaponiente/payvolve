import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  previousSemiMonthlyPeriod,
  semiMonthlyPeriodFor,
} from "../src/lib/payroll/period";
import { weekOf } from "../src/lib/schedule/week";
import { buildSampleAttendance } from "../src/lib/attendance/sample";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const existing = await prisma.company.findFirst({
    where: { name: "Kanto Kitchen Inc." },
  });
  if (existing) {
    console.log("Demo company already seeded — skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  const periodStart = new Date(trialEndsAt.getFullYear(), trialEndsAt.getMonth(), 1);
  const periodEnd = new Date(
    trialEndsAt.getFullYear(),
    trialEndsAt.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const company = await prisma.company.create({
    data: {
      name: "Kanto Kitchen Inc.",
      users: {
        create: { email: "owner@demo.pondoflow", passwordHash, role: "OWNER" },
      },
      subscription: {
        create: {
          status: "TRIALING",
          trialEndsAt,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      },
    },
  });

  const employees = await Promise.all(
    [
      {
        firstName: "Maria",
        lastName: "Santos",
        position: "Restaurant Manager",
        payType: "MONTHLY" as const,
        baseRate: 25_000,
        email: "maria@demo.pondoflow",
      },
      {
        firstName: "Jose",
        lastName: "Reyes",
        position: "Head Cook",
        payType: "MONTHLY" as const,
        baseRate: 20_800,
        email: null,
      },
      {
        firstName: "Ana",
        lastName: "Cruz",
        position: "Server",
        payType: "DAILY" as const,
        baseRate: 645,
        email: null,
      },
      {
        firstName: "Paolo",
        lastName: "Garcia",
        position: "Barista",
        payType: "HOURLY" as const,
        baseRate: 85,
        email: null,
      },
    ].map(async (e) =>
      prisma.employee.create({
        data: {
          company: { connect: { id: company.id } },
          firstName: e.firstName,
          lastName: e.lastName,
          position: e.position,
          hireDate: new Date(2025, 0, 15),
          payType: e.payType,
          baseRate: e.baseRate,
          tin: "123-456-789-000",
          sssNumber: "34-1234567-8",
          philhealthNumber: "12-345678901-2",
          pagibigNumber: "1234-5678-9012",
          user: e.email
            ? {
                create: {
                  email: e.email,
                  passwordHash,
                  role: "EMPLOYEE" as const,
                  companyId: company.id,
                },
              }
            : undefined,
        },
      }),
    ),
  );

  // Varied attendance (absences, lates, undertime, overtime, night shifts) for
  // the previous cutoff (drives payroll) and the elapsed part of the current
  // cutoff (shows on the timesheet).
  const period = previousSemiMonthlyPeriod(new Date());
  const current = semiMonthlyPeriodFor(new Date());
  const now = new Date();
  const currentEnd = now < current.end ? now : current.end;
  const entries = [
    ...buildSampleAttendance(employees, period),
    ...buildSampleAttendance(employees, { start: current.start, end: currentEnd }),
  ];

  await prisma.timeEntry.createMany({
    data: entries.map((e) => ({ ...e, source: "CLOCK" as const })),
  });

  // Upcoming shifts for the current week (Mon–Sat) so the schedule grid is populated.
  const week = weekOf(new Date());
  const roles = ["Manager", "Head Cook", "Server", "Barista"];
  const shifts: {
    companyId: string;
    employeeId: string;
    startsAt: Date;
    endsAt: Date;
    role: string;
  }[] = [];
  for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
    for (const [i, employee] of employees.entries()) {
      const startsAt = new Date(week.days[dayIdx]);
      const endsAt = new Date(week.days[dayIdx]);
      if (i === 1) {
        startsAt.setHours(14, 0, 0, 0);
        endsAt.setHours(22, 0, 0, 0);
      } else {
        startsAt.setHours(9, 0, 0, 0);
        endsAt.setHours(17, 0, 0, 0);
      }
      shifts.push({
        companyId: company.id,
        employeeId: employee.id,
        startsAt,
        endsAt,
        role: roles[i] ?? "",
      });
    }
  }
  await prisma.shift.createMany({ data: shifts });

  console.log(
    `Seeded ${company.name}: owner@demo.pondoflow / maria@demo.pondoflow (password: password123), ` +
      `${employees.length} employees, ${entries.length} time entries for ` +
      `${period.start.toDateString()} – ${period.end.toDateString()}, ` +
      `${shifts.length} shifts for the week of ${week.start.toDateString()}.`,
  );
}

main().finally(() => prisma.$disconnect());
