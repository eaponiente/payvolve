import { prisma } from "@/lib/db";

/**
 * Invalidate every JWT already issued for this user by bumping their
 * tokenVersion. A returning session is only re-checked against the DB once
 * per hour (see the `jwt` callback in `src/auth.ts`), so the user is forced
 * back to `/login` within that window rather than immediately — this trades
 * instant revocation for avoiding a DB round-trip on every request.
 *
 * Call this anywhere access should be revoked ahead of the token's natural
 * expiry, e.g. after changing a user's role, deactivating their account, or
 * a "sign out of all devices" action.
 */
export async function revokeUserSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}
