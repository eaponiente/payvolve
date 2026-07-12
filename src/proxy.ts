import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Defense-in-depth route gate. Every `(app)` page and server action still
 * enforces its own guard (`requireUser` / `requireAdmin` / `requireOwner`);
 * this blocks an unauthenticated request to a protected route before any page
 * code runs, so a page that ever forgets its guard isn't silently public.
 *
 * Next 16 renamed `middleware.ts` → `proxy.ts` (Node.js runtime by default).
 * We use a Prisma-free NextAuth instance (`authConfig`) so the proxy only
 * verifies the JWT — the DB-backed `tokenVersion` check stays in `auth.ts`.
 */
const { auth } = NextAuth(authConfig);

// Export as a specifier (not a destructured `export const`) so Next 16's proxy
// loader statically recognizes it as the proxy function export.
export { auth as proxy };

export const config = {
  // Protected product routes only — marketing, /login, /signup, and API auth
  // routes are intentionally excluded. `:path*` also matches the bare segment.
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/payroll/:path*",
    "/payslips/:path*",
    "/reports/:path*",
    "/schedule/:path*",
    "/time/:path*",
    "/billing/:path*",
    "/dev/:path*",
  ],
};
