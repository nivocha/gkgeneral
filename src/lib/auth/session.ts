import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

function parseCookie(cookie: string, name: string): string | null {
  for (const part of cookie.split(";")) {
    const eq = part.indexOf("=")
    if (eq === -1) continue
    const key = part.slice(0, eq).trim()
    if (key === name) return decodeURIComponent(part.slice(eq + 1).trim())
  }
  return null
}

export async function getAuth() {
  try {
    const h = await headers()
    const cookie = h.get("cookie") || ""
    const raw = parseCookie(cookie, "__Secure-better-auth.session_token") || parseCookie(cookie, "better-auth.session_token")
    if (!raw) return null
    const token = raw.split(".")[0]
    const session = await prisma.session.findUnique({ where: { token }, include: { user: true } })
    if (!session || session.expiresAt < new Date()) return null
    return { session, user: session.user }
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
