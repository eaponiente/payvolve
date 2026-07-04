# Payvolve — Payroll Core MVP

A multi-tenant payroll web app for Philippine businesses: employees → time & attendance → semi-monthly payroll runs with real PH statutory deductions → payslips and BIR-friendly CSV exports.

**Stack:** Next.js (App Router, TypeScript) · Prisma 7 + Postgres · Auth.js v5 · Tailwind CSS 4 · Vitest · installable PWA.

## Features

- **Multi-tenant SaaS** — company signup; every query scoped by `companyId`; roles: `OWNER`, `ADMIN`, `EMPLOYEE`
- **Employees** — profiles, pay setup (monthly/daily/hourly), TIN/SSS/PhilHealth/Pag-IBIG numbers, optional self-service login
- **Time tracking** — mobile-first clock in/out for crew; admin timesheet with manual entries (overnight shifts supported)
- **Payroll engine** (`src/lib/payroll/`, pure + unit-tested)
  - Overtime (125%) and night differential (+10%, 22:00–06:00)
  - SSS 2025 table (15%: 5% EE / 10% ER, MSC ₱5k–₱35k)
  - PhilHealth 5% (floor ₱10k, ceiling ₱100k)
  - Pag-IBIG 2% (₱200 cap)
  - BIR semi-monthly withholding table (2023+)
  - 13th-month pay runs (1/12 of basic earned, tax-exempt)
- **Payroll runs** — draft → review → recompute → finalize (immutable)
- **Payslips** — printable (print CSS → Save as PDF); employees see only their own, finalized slips
- **Reports** — payroll register CSV per finalized run

## Getting started

```bash
# 1. Postgres (Docker)
docker run -d --name payvolve-pg -e POSTGRES_USER=payvolve -e POSTGRES_PASSWORD=payvolve \
  -e POSTGRES_DB=payvolve -p 5433:5432 postgres:16-alpine

# 2. Install, migrate, seed
npm install
npx prisma migrate dev
npm run db:seed

# 3. Run
npm run dev
```

`.env` expects `DATABASE_URL` and `AUTH_SECRET` (see the checked-in dev values; change for production).

### Demo accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Owner | `owner@demo.payvolve` | `password123` |
| Employee | `maria@demo.payvolve` | `password123` |

The seed creates **Kanto Kitchen Inc.** with 4 employees and two weeks of time entries (including overtime and night shifts) for the previous cutoff — create a payroll run with the pre-filled default period to see it end-to-end.

## Tests

```bash
npm test   # payroll engine known-answer tests (SSS/PhilHealth/Pag-IBIG/BIR, OT/ND, 13th month)
```

## Simplifications (MVP)

- Statutory tables are code constants (`src/lib/payroll/statutory/`) — update when government schedules change
- Contributions are table-driven off monthly basic salary and split evenly across the two cutoffs
- Monthly-rate hourly equivalent uses a 26-workday month
- No holiday-pay calendar, leave management, or scheduling yet (later phases)
