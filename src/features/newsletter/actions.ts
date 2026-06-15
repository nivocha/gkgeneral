"use server"

import { prisma } from "@/lib/prisma"

export async function subscribeAction(formData: FormData) {
  const email = formData.get("email") as string

  if (!email || !email.includes("@")) {
    return { success: false, message: "Please enter a valid email address." }
  }

  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Subscriber" WHERE email = ${email} LIMIT 1
  `

  if (existing.length > 0) {
    return { success: false, message: "You are already subscribed!" }
  }

  await prisma.$executeRaw`
    INSERT INTO "Subscriber" (id, email, "createdAt")
    VALUES (gen_random_uuid()::text, ${email}, NOW())
  `

  return { success: true, message: "Subscribed successfully!" }
}
