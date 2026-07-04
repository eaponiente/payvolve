import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { previousSemiMonthlyPeriod } from "../src/lib/payroll/period";
import { weekOf } from "../src/lib/schedule/week";

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
        create: { email: "owner@demo.payvolve", passwordHash, role: "OWNER" },
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
        email: "maria@demo.payvolve",
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

  // Time entries covering the previous cutoff so a payroll run works out of the box.
  const period = previousSemiMonthlyPeriod(new Date());
  const entries: {
    employeeId: string;
    clockIn: Date;
    clockOut: Date;
  }[] = [];

  const day = new Date(period.start);
  while (day <= period.end) {
    const weekday = day.getDay();
    if (weekday !== 0) {
      // closed Sundays
      for (const [i, employee] of employees.entries()) {
        // Everyone works; stagger shifts a bit per employee
        const start = new Date(day);
        const end = new Date(day);
        if (i === 1) {
          // Head cook: 14:00–24:00 (2h OT + 2h night diff)
          start.setHours(14, 0, 0, 0);
          end.setHours(24, 0, 0, 0);
        } else if (i === 3 && weekday === 6) {
          // Barista pulls a long Saturday: 08:00–18:00 (2h OT)
          start.setHours(8, 0, 0, 0);
          end.setHours(18, 0, 0, 0);
        } else {
          start.setHours(9, 0, 0, 0);
          end.setHours(17, 0, 0, 0);
        }
        entries.push({ employeeId: employee.id, clockIn: start, clockOut: end });
      }
    }
    day.setDate(day.getDate() + 1);
  }

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
    `Seeded ${company.name}: owner@demo.payvolve / maria@demo.payvolve (password: password123), ` +
      `${employees.length} employees, ${entries.length} time entries for ` +
      `${period.start.toDateString()} – ${period.end.toDateString()}, ` +
      `${shifts.length} shifts for the week of ${week.start.toDateString()}.`,
  );
}

main().finally(() => prisma.$disconnect());
