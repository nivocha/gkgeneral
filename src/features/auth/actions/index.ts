"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export async function signInAction(_prevState: unknown, formData: FormData) {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validated.success) {
    return { success: false, message: "Invalid credentials", errors: validated.error.flatten().fieldErrors }
  }

  try {
    const { email, password } = validated.data
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    })
    revalidatePath("/")
    const role = (result?.user as { role?: string })?.role || "customer"
    return { success: true, message: "Signed in successfully", role }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to sign in" }
  }
}

export async function signUpAction(_prevState: unknown, formData: FormData) {
  const validated = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validated.success) {
    return { success: false, message: "Invalid input", errors: validated.error.flatten().fieldErrors }
  }

  try {
    const { name, email, password } = validated.data
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    })
    revalidatePath("/")
    return { success: true, message: "Account created successfully" }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create account" }
  }
}

export async function signOutAction(formData?: FormData): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() })
    revalidatePath("/")
  } catch {
    console.error("Failed to sign out")
  }
}

export async function getCurrentUserAction() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return { success: false, message: "Not authenticated" }
    }
    const user = session.user as { id: string; name: string; email: string; image?: string | null; role?: string; phone?: string }
    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || null,
        role: (user.role as string) || "customer",
        phone: user.phone || null,
      },
    }
  } catch {
    return { success: false, message: "Not authenticated" }
  }
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireAuth()
  const name = formData.get("name") as string
  const phone = formData.get("phone") as string

  try {
    await auth.api.updateUser({
      body: { name },
      headers: await headers(),
    })
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: phone || null },
    })
    revalidatePath("/account/profile")
  } catch {
    console.error("Failed to update profile")
  }
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const user = await requireAuth()
  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers: await headers(),
    })
    revalidatePath("/account/profile")
  } catch {
    console.error("Failed to change password")
  }
}
