"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/session"
import { generateOrderNumber } from "@/lib/utils"
import { logAuditEvent } from "@/lib/logger/prisma"

const adminCreateOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(5, "Phone number is required"),
  shippingMethod: z.enum(["standard", "express", "same_day"]),
  paymentMethod: z.enum(["bank_transfer", "mobile_money", "credit_card"]).default("bank_transfer"),
  notes: z.string().optional(),
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
  const shippingRates: Record<string, number> = { standard: 0, express: 15000, same_day: 35000 }
  const shipping = shippingRates[validated.shippingMethod] ?? 0
  const taxRate = 0.18
  const tax = Math.round(subtotal * taxRate * 100) / 100
  const total = Math.round((subtotal + tax + shipping) * 100) / 100
  const orderNumber = generateOrderNumber(crypto.randomUUID())

  let customerId = admin.id
  if (validated.customerEmail !== admin.email) {
    const existing = await prisma.user.findUnique({ where: { email: validated.customerEmail } })
    if (existing) {
      customerId = existing.id
    } else {
      const created = await prisma.user.create({
        data: {
          name: validated.customerName,
          email: validated.customerEmail,
          phone: validated.customerPhone,
          role: "customer",
          emailVerified: false,
        },
      })
      customerId = created.id
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: customerId,
        orderNumber,
        status: "Pending",
        subtotal,
        tax,
        shipping,
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
            note: `Order created by admin for ${validated.customerName}`,
          },
        },
        payment: {
          create: {
            method: validated.paymentMethod,
            status: "Pending",
            amount: total,
            currency: "USD",
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
    description: `Admin created order ${orderNumber} for ${validated.customerName}`,
    metadata: { total, itemCount: validated.items.length, customerEmail: validated.customerEmail },
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
