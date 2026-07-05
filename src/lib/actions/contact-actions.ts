"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export type ContactState = { error?: string; success?: boolean } | undefined;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  company: z.string().trim().default(""),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a bit more (at least 10 characters)")
    .max(2000, "Message is too long"),
});

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot: real visitors never see or fill this hidden field, but bots
  // that blindly fill every input will. Pretend success without writing
  // anything, so the bot doesn't learn to look for a better signal.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { success: true };
  }

  const ip = await clientIp();
  const { success } = rateLimit(ip, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!success) {
    return { error: "Too many messages. Please try again later." };
  }

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
