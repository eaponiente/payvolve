# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Payvolve is a **multi-tenant payroll SaaS for Philippine businesses** (payroll, scheduling, time tracking, billing) plus a public marketing site. Stack: Next.js 16 (App Router) · Prisma 7 · PostgreSQL · Auth.js v5 · Tailwind 4 · Vitest · Playwright.

## Commands

```bash
npm run dev              # dev server → http://localhost:3000
npm run build            # production build (also the fastest full typecheck of the app)
npm run lint             # eslint
npx tsc --noEmit         # typecheck only

npm test                 # all Vitest unit tests (payroll + billing engines)
npx vitest run src/lib/payroll/run.test.ts   # a single test file
npx vitest run -t "13th month"               # tests matching a name
npx vitest                                    # watch mode

npm run db:seed          # seed demo data (idempotent — skips if demo company exists)
```

**Database** runs in Docker on **port 5433** (not the default 5432):
```bash
docker start payvolve-pg    # start existing container
npx prisma migrate dev --name <change>   # create + apply a migration
npx prisma generate                       # REQUIRED after any schema change (see gotchas)
npx prisma migrate reset --force          # drop + re-migrate (then run db:seed — reset may skip it)
```

## Critical workflow gotchas

1. **After editing `prisma/schema.prisma`, run BOTH `prisma migrate dev` AND `prisma generate`.** The generated client is not auto-regenerated; skipping `generate` produces `Property '<model>' does not exist on type 'PrismaClient'` errors at typecheck/build. This has bitten every schema change so far.
2. **Import the Prisma client from the generated path**, not `@prisma/client`: `import { prisma } from "@/lib/db"` (which instantiates `PrismaClient` from `@/generated/prisma/client` with the `@prisma/adapter-pg` driver adapter). Never `new PrismaClient()` elsewhere.
3. **`migrate reset --force` may not run the seed** — run `npm run db:seed` afterward. In a non-interactive shell, destructive Prisma commands require `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=<reason>`.
4. **Stale session after a DB reset**: the JWT holds the old `companyId`; `(app)/layout.tsx` now redirects such sessions to `/login` instead of 500-ing. Fix is to log in again.
5. `.env` requires `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`.

## Architecture

**Route groups** (`src/app/`):
- `(app)/` — the authenticated product. `(app)/layout.tsx` is the gatekeeper: it calls `requireUser()`, loads the company, and renders role-aware nav. Every page under it assumes an authenticated, tenant-scoped user.
- `(auth)/` — `login` / `signup`.
- Root `/` and marketing pages (`pricing`, `about`, `privacy-policy`, `privacy-notice`, `terms`) are **public**; `/` redirects logged-in users to `/dashboard`.

**Multi-tenancy is the core invariant.** The Auth.js JWT session carries `{ id, companyId, role, employeeId }` (see `src/auth.ts`). `src/lib/tenant.ts` provides the guards — `requireUser` / `requireAdmin` / `requireOwner` (redirect on failure) and `isAdmin`. **Every DB query must be scoped by `companyId`**, and tenant-safe writes use `updateMany`/`deleteMany` with `companyId` in the `where` filter. Roles: `OWNER` (full + billing), `ADMIN` (payroll/schedules/time), `EMPLOYEE` (own data only). `ContactMessage` is the one tenant-less model (public contact form).

**Mutations are server actions** in `src/lib/actions/*.ts` (`"use server"`): validate input with Zod, re-assert the role guard inside the action, then write. Pages are Server Components that read via `prisma` directly.

**Domain logic is pure and framework-free** under `src/lib/`, unit-tested with known-answer tests asserting exact peso amounts:
- `payroll/` — the engine. `statutory/{sss,philhealth,pagibig,bir}.ts` hold current PH government tables as code constants; `hours.ts` (OT / night-diff aggregation), `earnings.ts`, `thirteenth.ts`, and `run.ts` (orchestrates a per-employee payslip). `money.ts` `round2()` is the mandatory money-rounding convention (half-up, float-drift-stabilized). When changing statutory rules, update the corresponding `*.test.ts`.
- `billing/` — `pricing.ts` (₱999/company + ₱100/employee + optional EWA add-on), `subscription.ts` (lazy get-or-create + entitlement). **Payments are simulated**: the sole integration point is `chargeCustomer()` in `actions/billing-actions.ts` — swap it for PayMongo/Stripe to go live.
- `schedule/week.ts`, `payroll/period.ts`, `billing/period.ts` — date/period helpers (semi-monthly cutoffs, Mon–Sun weeks, calendar-month billing).

**Data model** (`prisma/schema.prisma`): `Company` is the tenant root → `User`, `Employee`, `TimeEntry`, `Shift`, `PayrollRun` → `Payslip`, `Subscription`, `Invoice`. Payslips store a JSON `breakdown` plus denormalized totals.

**Marketing components** in `src/components/marketing/` reuse the real `payroll/statutory` and `billing/pricing` functions to power the live net-pay calculator and pricing slider — so the landing page math always matches actual payroll.

## Verifying changes

Pure logic → add/adjust Vitest known-answer tests. Full flows → drive a running server with Playwright (`channel: "chrome"`, headless) — build, `npm start -- -p <port>`, log in, exercise the flow, assert on rendered peso amounts and tenant isolation (a second company must see zero data from the first). Scratch e2e scripts import Playwright by absolute path from `node_modules`.
