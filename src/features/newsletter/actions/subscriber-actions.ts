"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { revalidatePath } from "next/cache"

export async function getSubscribers(page = 1, pageSize = 20, search?: string) {
  await requireRole("super_admin", "admin")
  const where = search
    ? { email: { contains: search, mode: "insensitive" as const } }
    : {}
  const [subscribers, total] = await Promise.all([
    prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.subscriber.count({ where }),
  ])
  return { subscribers, total, pages: Math.ceil(total / pageSize) }
}

export async function deleteSubscriber(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireRole("super_admin", "admin")
  await prisma.subscriber.delete({ where: { id } })

  await logAuditEvent({
    userId: user.id,
    action: "SUBSCRIBER_DELETED",
    entity: "subscriber",
    entityId: id,
    description: "Deleted subscriber",
  })

  revalidatePath("/admin/dashboard/subscribers")
}

export async function exportSubscribersCSV(): Promise<string> {
  await requireRole("super_admin", "admin")
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  })

  const header = "Email,Created At"
  const rows = subscribers.map((s) => `${s.email},${s.createdAt.toISOString()}`)
  return [header, ...rows].join("\n")
}
