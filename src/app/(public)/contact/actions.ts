"use server"

import { prisma } from "@/lib/prisma"

export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const subject = formData.get("subject") as string
  const message = formData.get("message") as string

  if (!name || !email || !subject || !message) {
    return { success: false, message: "Please fill in all required fields." }
  }

  await prisma.$executeRaw`
    INSERT INTO "ContactSubmission" (id, name, email, phone, subject, message, "createdAt")
    VALUES (gen_random_uuid()::text, ${name}, ${email}, ${phone || null}, ${subject}, ${message}, NOW())
  `

  return { success: true, message: "Message sent successfully!" }
}
