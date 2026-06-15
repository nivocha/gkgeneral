"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  try {
    const user = await requireAuth()
    return prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  } catch {
    return []
  }
}

export async function markNotificationRead(id: string) {
  try {
    const user = await requireAuth()
    await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { isRead: true } })
    revalidatePath("/account/notifications")
  } catch {}
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    const user = await requireAuth()
    await prisma.notification.updateMany({ where: { userId: user.id }, data: { isRead: true } })
    revalidatePath("/account/notifications")
  } catch {}
}

export async function getUnreadCount() {
  try {
    const user = await requireAuth()
    return prisma.notification.count({ where: { userId: user.id, isRead: false } })
  } catch {
    return 0
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type?: string,
  link?: string
) {
  return prisma.notification.create({ data: { userId, title, message, type: type || "info", link } })
}
