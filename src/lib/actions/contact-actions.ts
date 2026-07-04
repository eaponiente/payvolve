"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";

export type ContactState = { error?: string; success?: boolean } | undefined;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  company: z.string().trim().default(""),
  message: z.string().trim().min(10, "Tell us a bit more (at least 10 characters)"),
});

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.contactMessage.create({ data: parsed.data });
  return { success: true };
}
