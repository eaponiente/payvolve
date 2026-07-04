"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/tenant";

export type BugState = { error?: string; success?: boolean } | undefined;

const bugSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  feedback: z.string().trim().min(10, "Please describe the bug (at least 10 characters)"),
});

export async function submitBugReport(
  _prev: BugState,
  formData: FormData,
): Promise<BugState> {
  const user = await requireUser();
  const parsed = bugSchema.safeParse({
    name: formData.get("name"),
    feedback: formData.get("feedback"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true },
  });

  await prisma.bugReport.create({
    data: {
      name: parsed.data.name,
      feedback: parsed.data.feedback,
      reporterEmail: account?.email ?? "",
      companyId: user.companyId,
    },
  });
  return { success: true };
}
