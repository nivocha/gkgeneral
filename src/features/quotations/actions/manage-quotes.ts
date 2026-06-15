"use server"

import { requireAuth, requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const CreateQuoteSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
})

export async function createQuote(data: z.infer<typeof CreateQuoteSchema>) {
  const user = await requireAuth()
  const validated = CreateQuoteSchema.parse(data)

  const product = await prisma.product.findUnique({
    where: { id: validated.productId },
    select: { name: true, sku: true },
  })
  if (!product) throw new Error("Product not found")

  const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}-${user.id.slice(0, 4).toUpperCase()}`

  const quote = await prisma.quote.create({
    data: {
      userId: user.id,
      quoteNumber,
      status: "Submitted",
      notes: validated.notes,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: {
          productId: validated.productId,
          name: product.name,
          sku: product.sku,
          quantity: validated.quantity,
          notes: validated.notes,
        },
      },
    },
    include: { items: true },
  })

  await logAuditEvent({
    userId: user.id,
    action: "QUOTE_CREATED",
    entity: "quote",
    entityId: quote.id,
    description: `Quote ${quote.quoteNumber} created`,
  })

  revalidatePath("/account/quotes")
  return { success: true, quote }
}

export async function getCustomerQuotes(page = 1, pageSize = 10) {
  const user = await requireAuth()
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.quote.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: { select: { slug: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.quote.count({ where: { userId: user.id } }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getCustomerQuote(id: string) {
  const user = await requireAuth()
  const quote = await prisma.quote.findFirst({
    where: { id, userId: user.id },
    include: {
      items: {
        include: { product: { select: { slug: true, name: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } } },
      },
    },
  })
  if (!quote) throw new Error("Quote not found")
  return quote
}

export async function cancelQuote(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) return

  const user = await requireAuth()
  const quote = await prisma.quote.findFirst({ where: { id, userId: user.id } })
  if (!quote) throw new Error("Quote not found")
  if (quote.status !== "Submitted" && quote.status !== "Draft") {
    throw new Error("Cannot cancel quote in current status")
  }

  await prisma.quote.update({ where: { id }, data: { status: "Rejected" } })

  await logAuditEvent({
    userId: user.id,
    action: "QUOTE_CANCELLED",
    entity: "quote",
    entityId: id,
    description: `Quote ${quote.quoteNumber} cancelled`,
  })

  revalidatePath("/account/quotes")
}

export async function getAdminQuotes(page = 1, pageSize = 20, status?: string) {
  await requireRole("super_admin", "admin", "sales_manager")
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (status && status !== "all") where.status = status

  const [items, total] = await Promise.all([
    prisma.quote.findMany({
      where: where as any,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.quote.count({ where: where as any }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getAdminQuote(id: string) {
  await requireRole("super_admin", "admin", "sales_manager")
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: { product: { select: { slug: true, name: true, sku: true } } },
      },
    },
  })
  if (!quote) throw new Error("Quote not found")
  return quote
}

export async function updateQuoteStatus(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  const status = formData.get("status") as string
  if (!id || !status) return

  const user = await requireRole("super_admin", "admin", "sales_manager")
  const validStatuses = ["Draft", "Submitted", "Reviewing", "Approved", "Rejected", "Converted"]
  if (!validStatuses.includes(status)) throw new Error("Invalid status")

  const quote = await prisma.quote.update({
    where: { id },
    data: { status: status as any },
  })

  await logAuditEvent({
    userId: user.id,
    action: "QUOTE_STATUS_UPDATED",
    entity: "quote",
    entityId: id,
    description: `Quote ${quote.quoteNumber} status changed to ${status}`,
  })

  revalidatePath("/admin/dashboard/quotes")
  revalidatePath("/account/quotes")
}
