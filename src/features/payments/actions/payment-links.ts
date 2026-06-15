"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { prisma, PaymentLinkStatus } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth/session"
import { logAuditEvent } from "@/lib/logger/prisma"

export async function generatePaymentLink(orderId: string) {
  const user = await requireAuth()
  await requireRole("super_admin", "admin", "finance")

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) throw new Error("Order not found")
  if (order.status === "Cancelled" || order.status === "Refunded") {
    throw new Error("Cannot create payment link for cancelled or refunded orders")
  }

  const existing = await prisma.paymentLink.findFirst({
    where: { orderId, status: "Active" },
  })
  if (existing) return { token: existing.token, url: `${process.env.APP_URL}/pay/${existing.token}` }

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.paymentLink.create({
    data: { token, orderId, expiresAt },
  })

  await logAuditEvent({
    userId: user.id,
    action: "PAYMENT_LINK_CREATED",
    entity: "PaymentLink",
    entityId: token,
    metadata: { orderId },
  })

  revalidatePath(`/admin/dashboard/orders/${orderId}`)

  return { token, url: `${process.env.APP_URL}/pay/${token}` }
}

export async function getPaymentLinkByToken(token: string) {
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: {
      order: {
        include: {
          items: {
            include: { product: { select: { name: true, slug: true, images: true } } },
          },
        },
      },
    },
  })

  if (!link) return null
  if (link.status === "Expired") return null
  if (link.expiresAt && link.expiresAt < new Date()) {
    await prisma.paymentLink.update({ where: { id: link.id }, data: { status: "Expired" } })
    return null
  }
  if (link.status === "Paid") return { ...link, paid: true }

  return link
}

export async function updatePaymentLinkCustomer(
  token: string,
  data: { name: string; phone: string; email?: string; address?: Record<string, unknown> }
) {
  const link = await prisma.paymentLink.findUnique({ where: { token } })
  if (!link || link.status !== "Active") throw new Error("Invalid or expired payment link")

  await prisma.paymentLink.update({
    where: { id: link.id },
    data: {
      customerName: data.name,
      customerPhone: data.phone,
      customerEmail: data.email,
      customerAddress: data.address as never ?? undefined,
    },
  })
}

export async function getPaymentLinksForOrder(orderId: string) {
  return prisma.paymentLink.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true, total: true } } },
  })
}

export async function getAdminPaymentLinks(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize
  const [links, total] = await Promise.all([
    prisma.paymentLink.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { orderNumber: true, total: true, status: true } },
      },
    }),
    prisma.paymentLink.count(),
  ])
  return { links, total, page, pageSize }
}

export async function expirePaymentLink(linkId: string) {
  const user = await requireAuth()
  await requireRole("super_admin", "admin", "finance")

  await prisma.paymentLink.update({ where: { id: linkId }, data: { status: "Expired" } })

  await logAuditEvent({
    userId: user.id,
    action: "PAYMENT_LINK_EXPIRED",
    entity: "PaymentLink",
    entityId: linkId,
  })

  revalidatePath("/admin/dashboard/payment-links")
}
