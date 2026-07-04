"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { addDays, currentBillingPeriod } from "@/lib/billing/period";
import { TRIAL_DAYS } from "@/lib/billing/pricing";

export type FormState = { error?: string; success?: boolean } | undefined;

const signupSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signup(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
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
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
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
