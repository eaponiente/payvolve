import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      companyId: string;
      role: Role;
      employeeId: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    companyId: string;
    role: Role;
    employeeId: string | null;
    tokenVersion: number;
  }
}

/** How often a returning session re-checks tokenVersion against the DB. */
const TOKEN_REVALIDATE_INTERVAL_SECONDS = 60 * 60; // 1 hour

/** Consecutive failed logins that lock an account, and for how long. */
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // session, pages, and the proxy `authorized` callback
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { employee: { select: { id: true } } },
        });
        if (!user) return null;

        // Account locked from prior failures: refuse without checking the
        // password, so repeated attempts during the window don't extend it.
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          // Count this failure; lock the account once the threshold is hit
          // (resetting the counter so the next window starts clean).
          const attempts = user.failedLoginAttempts + 1;
          await prisma.user.update({
            where: { id: user.id },
            data:
              attempts >= MAX_FAILED_LOGINS
                ? { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS) }
                : { failedLoginAttempts: attempts },
          });
          return null;
        }

        // Successful login: clear any accumulated failures / lockout.
        if (user.failedLoginAttempts !== 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          companyId: user.companyId,
          role: user.role,
          employeeId: user.employee?.id ?? null,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks, // keep `authorized` (used by proxy.ts)
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: seed the token from the freshly-authenticated user.
        token.id = user.id;
        token.companyId = user.companyId;
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.tokenVersion = user.tokenVersion;
        token.iat = Math.floor(Date.now() / 1000);
        return token;
      }

      // Returning session. Avoid a DB round-trip on every request — only
      // revalidate once the token has aged past the interval.
      const issuedAt = token.iat ?? 0;
      const ageSeconds = Math.floor(Date.now() / 1000) - issuedAt;
      if (ageSeconds < TOKEN_REVALIDATE_INTERVAL_SECONDS) {
        return token;
      }

      const userId = token.id as string | undefined;
      if (!userId) return {};

      const account = await prisma.user.findUnique({
        where: { id: userId },
        select: { tokenVersion: true, role: true, companyId: true },
      });

      if (!account || account.tokenVersion !== (token.tokenVersion as number | undefined)) {
        // The account was deleted, or tokenVersion was bumped (e.g. a role
        // change or forced logout) since this token was issued — invalidate.
        return {};
      }

      // Pick up any role/company change and reset the revalidation clock.
      token.role = account.role;
      token.companyId = account.companyId;
      token.iat = Math.floor(Date.now() / 1000);
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.companyId = token.companyId as string;
      session.user.role = token.role as Role;
      session.user.employeeId = (token.employeeId as string | null) ?? null;
      return session;
    },
  },
});
