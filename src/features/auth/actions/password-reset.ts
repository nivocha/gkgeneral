"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export async function forgotPasswordAction(_prevState: unknown, formData: FormData) {
  const validated = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!validated.success) {
    return { success: false, message: "Invalid email address" }
  }

  try {
    const { email } = validated.data
    await auth.api.requestPasswordReset({
      body: { email },
      headers: await headers(),
    })
    return {
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    }
  } catch (error) {
    return {
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    }
  }
}

export async function resetPasswordAction(_prevState: unknown, formData: FormData) {
  const validated = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validated.success) {
    return { success: false, message: "Invalid input", errors: validated.error.flatten().fieldErrors }
  }

  try {
    const { token, password } = validated.data
    await auth.api.resetPassword({
      body: { newPassword: password, token },
      headers: await headers(),
    })
    return { success: true, message: "Password reset successfully. You can now sign in." }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to reset password" }
  }
}
