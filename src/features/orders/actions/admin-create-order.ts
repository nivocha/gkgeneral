"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/session"
import { generateOrderNumber } from "@/lib/utils"
import { logAuditEvent } from "@/lib/logger/prisma"

const adminCreateOrderSchema = z.object({
  notes: z.string().optional(),
  chargeVat: z.boolean().default(false),
  totalOverride: z.number().nonnegative().optional(),
  adjustmentReason: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    sku: z.string().optional(),
    price: z.number(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
  })).min(1, "At least one item is required"),
})

export type AdminCreateOrderInput = z.infer<typeof adminCreateOrderSchema>

export async function searchProductsForAdmin(query: string) {
  const user = await requireRole("super_admin", "admin", "sales_manager")
  if (!query || query.length < 2) return { items: [] }
  const sanitized = query.replace(/[^\w\s-]/g, "").trim()
  const items = await prisma.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: sanitized, mode: "insensitive" } },
        { sku: { contains: sanitized, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
    },
    orderBy: { name: "asc" },
    take: 20,
  })
  return {
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      sku: i.sku,
      price: Number(i.price),
      image: i.images[0]?.url ?? null,
    })),
  }
}

export async function createAdminOrder(data: AdminCreateOrderInput) {
  const admin = await requireRole("super_admin", "admin", "sales_manager")

  const validated = adminCreateOrderSchema.parse(data)

  const subtotal = validated.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const taxRate = 0.18
  const subtotalWithTax = validated.chargeVat
    ? Math.round(subtotal * (1 + taxRate) * 100) / 100
    : subtotal
  const calculatedTotal = Math.round(subtotalWithTax * 100) / 100
  const total = validated.totalOverride !== undefined
    ? Math.round(validated.totalOverride * 100) / 100
    : calculatedTotal
  const tax = validated.chargeVat
    ? Math.round(subtotal * taxRate * 100) / 100
    : 0
  const orderNumber = generateOrderNumber(crypto.randomUUID())

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: admin.id,
        orderNumber,
        status: "Pending",
        subtotal,
        tax,
        shipping: 0,
        total,
        currency: "USD",
        notes: validated.notes ?? null,
        items: {
          create: validated.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            sku: i.sku || "",
            quantity: i.quantity,
            price: i.price,
            total: i.price * i.quantity,
          })),
        },
        statusHistory: {
          create: {
            status: "Pending",
            changedBy: admin.id,
            note: validated.adjustmentReason || "Order created by admin",
          },
        },
      },
      include: { items: true },
    })

    for (const item of validated.items) {
      const inventories = await tx.inventory.findMany({
        where: { productId: item.productId, quantity: { gt: 0 } },
        orderBy: { quantity: "desc" },
      })
      let toReserve = item.quantity
      for (const inv of inventories) {
        if (toReserve <= 0) break
        const take = Math.min(toReserve, inv.quantity)
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            quantity: { decrement: take },
            reservedQuantity: { increment: take },
          },
        })
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: inv.warehouseId,
            type: "RESERVED",
            quantity: take,
            reference: orderNumber,
            note: "Reserved via admin order",
          },
        })
        toReserve -= take
      }
    }

    return created
  })

  await logAuditEvent({
    userId: admin.id,
    action: "CREATE",
    entity: "order",
    entityId: order.id,
    description: `Admin created order ${orderNumber}`,
    metadata: { total, itemCount: validated.items.length },
  })

  revalidatePath("/admin/dashboard/orders")

  return {
    success: true,
    message: "Order created successfully",
    data: {
      orderId: order.id,
      orderNumber,
      status: "Pending" as const,
    },
  }
}
