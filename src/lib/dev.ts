import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/tenant";

/** Platform-dev allowlist from the DEV_EMAILS env var (comma-separated). */
export function devEmails(): string[] {
  return (process.env.DEV_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isDevEmail(email?: string | null): boolean {
  if (!email) return false;
  return devEmails().includes(email.toLowerCase());
}

/**
 * Require a signed-in platform dev. Resolves the email from the DB (not the
 * session token) so the gate can't be spoofed, then redirects non-devs away.
 */
export async function requireDev() {
  const user = await requireUser();
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true },
  });
  if (!isDevEmail(account?.email)) redirect("/dashboard");
  return { ...user, email: account!.email };
}

/** Non-redirecting check for conditional nav rendering. */
export async function currentUserIsDev(userId: string): Promise<boolean> {
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return isDevEmail(account?.email);
}
