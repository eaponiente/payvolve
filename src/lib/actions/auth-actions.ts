"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { addDays, currentBillingPeriod } from "@/lib/billing/period";
import { TRIAL_DAYS } from "@/lib/billing/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

export type FormState = { error?: string; success?: boolean } | undefined;

const signupSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signup(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  // Cap new-account creation per IP to blunt mass/automated signups.
  if (!rateLimit(`signup:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 }).success) {
    return { error: "Too many attempts. Please try again later." };
  }

  const parsed = signupSchema.safeParse({
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { companyName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.company.create({
    data: {
      name: companyName,
      users: { create: { email, passwordHash, role: "OWNER" } },
      subscription: {
        create: {
          status: "TRIALING",
          trialEndsAt: addDays(new Date(), TRIAL_DAYS),
          currentPeriodStart: currentBillingPeriod().start,
          currentPeriodEnd: currentBillingPeriod().end,
        },
      },
    },
  });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  // Throttle password attempts per IP to make brute-forcing impractical.
  if (!rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 }).success) {
    return { error: "Too many attempts. Please try again later." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Surface a clear lockout message (authorize() enforces it, but NextAuth
  // collapses credential errors to a generic message, so pre-check here).
  const account = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { lockedUntil: true },
  });
  if (account?.lockedUntil && account.lockedUntil > new Date()) {
    const minutes = Math.ceil((account.lockedUntil.getTime() - Date.now()) / 60000);
    return {
      error: `Account locked after too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw err; // NEXT_REDIRECT and friends must propagate
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
