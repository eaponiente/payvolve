import type { NextAuthConfig } from "next-auth";

/**
 * Proxy-safe auth config: no Prisma / bcrypt / Node-only imports, so it can run
 * inside `proxy.ts`. The full config — the Credentials provider and the
 * DB-backed token revalidation — lives in `auth.ts`, which spreads this.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  providers: [],
  callbacks: {
    // Used by `proxy.ts` (via NextAuth's request wrapper) to gate matched
    // routes. Returning false redirects an unauthenticated request to signIn.
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
