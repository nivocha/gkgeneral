import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function getAuth() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    return session
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const session = await getAuth()
  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  let role = (user as any).role
  if (!role) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    role = dbUser?.role || "customer"
  }
  return { ...user, role } as { id: string; name: string; email: string; image?: string | null; role: string; phone?: string }
}

export async function requireRole(...roles: string[]) {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    redirect("/")
  }
  return user
}
