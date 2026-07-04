import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  companyId: string;
  role: "OWNER" | "ADMIN" | "EMPLOYEE";
  employeeId: string | null;
  email?: string | null;
};

/** Require a signed-in user; redirects to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");
  return session.user as SessionUser;
}

/** Require an OWNER or ADMIN user; employees are sent to their dashboard. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "EMPLOYEE") redirect("/dashboard");
  return user;
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === "OWNER" || user.role === "ADMIN";
}

/** Require the company OWNER (e.g. for billing); others go to their dashboard. */
export async function requireOwner(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "OWNER") redirect("/dashboard");
  return user;
}
