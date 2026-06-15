"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"
import { requireAuth } from "@/lib/auth/session"

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function sendVerificationEmailAction() {
  try {
    const user = await requireAuth()
    await auth.api.sendVerificationEmail({
      body: { email: user.email },
      headers: await headers(),
    })
    return { success: true, message: "Verification email sent." }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to send verification email" }
  }
}

export async function resendVerificationAction(_prevState: unknown, formData: FormData) {
  try {
    const validated = emailSchema.safeParse({ email: formData.get("email") })
    if (!validated.success) {
      return { success: false, message: "Invalid email address" }
    }
    await auth.api.sendVerificationEmail({
      body: { email: validated.data.email },
      headers: await headers(),
    })
    return { success: true, message: "Verification email sent. Check your inbox." }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to send verification email" }
  }
}

export async function verifyEmailAction(token: string) {
  try {
    await auth.api.verifyEmail({
      query: { token },
      headers: await headers(),
    })
    return { success: true, message: "Email verified successfully." }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to verify email" }
  }
}
