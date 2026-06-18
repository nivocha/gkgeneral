"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma, OrderStatus, PaymentStatus } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth/session"
import { generateOrderNumber } from "@/lib/utils"
import { logAuditEvent } from "@/lib/logger/prisma"
import { commitInventoryForOrder, releaseInventoryForOrder } from "@/features/payments/lib/inventory"

function isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    Pending: ["Processing", "Cancelled"],
    Processing: ["Shipped", "Cancelled", "Paid"],
    Paid: ["Processing", "Shipped", "Refunded"],
    Shipped: ["Delivered", "Cancelled"],
    Delivered: ["Refunded"],
    Cancelled: [],
    Refunded: [],
  }
  return transitions[current]?.includes(next) ?? false
}

const createOrderSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(5, "Phone number is required"),
  billingAddress: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default("Tanzania"),
  }),
  shippingAddress: z.object({
    sameAsBilling: z.boolean().default(true),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
  shippingMethod: z.enum(["standard", "express", "same_day"]),
  paymentMethod: z.enum(["bank_transfer", "mobile_money", "credit_card"]),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    sku: z.string().optional(),
    price: z.number(),
    quantity: z.number(),
  })).min(1, "Cart is empty"),
})

const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export async function createOrder(data: CreateOrderInput) {
  const user = await requireAuth()

  const validated = createOrderSchema.parse(data)

  const shippingRates: Record<string, number> = {
    standard: 0,
    express: 15000,
    same_day: 35000,
  }

  const taxRate = 0.18
  const orderItems = validated.items.map((i) => ({
    ...i,
    total: i.price * i.quantity,
  }))

  const subtotal = orderItems.reduce((s, i) => s + i.total, 0)
  const shipping = shippingRates[validated.shippingMethod] ?? 0
  const tax = Math.round(subtotal * taxRate * 100) / 100
  const total = Math.round((subtotal + tax + shipping) * 100) / 100
  const orderNumber = generateOrderNumber(crypto.randomUUID())

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: user.id,
        orderNumber,
        status: "Pending",
        subtotal,
        tax,
        shipping,
        total,
        currency: "USD",
        notes: validated.notes ?? null,
        items: {
          create: orderItems.map((i) => ({
            productId: i.productId,
            name: i.name,
            sku: i.sku || "",
            quantity: i.quantity,
            price: i.price,
            total: i.total,
          })),
        },
        statusHistory: {
          create: {
            status: "Pending",
            changedBy: user.id,
            note: "Order placed",
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
      include: { items: true, statusHistory: true, payment: true },
    })

    for (const item of orderItems) {
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
            note: "Reserved for order",
          },
        })
        toReserve -= take
      }
    }

    return created
  })

  await logAuditEvent({
    userId: user.id,
    action: "CREATE",
    entity: "order",
    entityId: order.id,
    description: `Order created: ${orderNumber}`,
    metadata: { total, itemCount: orderItems.length },
  })

  await prisma.cartItem.deleteMany({
    where: { cart: { userId: user.id } },
  })

  revalidatePath("/account/orders")
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

export async function getCustomerOrders(params?: { page?: number; pageSize?: number }) {
  const user = await requireAuth()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params?.pageSize ?? 10))
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where: { userId: user.id } }),
  ])

  return {
    items: items.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      currency: o.currency,
      createdAt: o.createdAt,
      itemCount: o._count.items,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getCustomerOrderById(id: string) {
  const user = await requireAuth()

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: { orderBy: { id: "asc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payment: true,
    },
  })

  if (!order) {
    return { success: false, message: "Order not found" }
  }

  return {
    success: true,
    data: {
      ...order,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      total: Number(order.total),
      items: order.items.map((i) => ({
        ...i,
        price: Number(i.price),
        total: Number(i.total),
      })),
      payment: order.payment
        ? { ...order.payment, amount: Number(order.payment.amount) }
        : null,
    },
  }
}

export async function getAdminOrders(params?: {
  page?: number
  pageSize?: number
  status?: OrderStatus | "all"
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}) {
  const user = await requireRole("super_admin", "admin", "sales_manager", "customer_support")

  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}

  if (params?.status && params.status !== "all") {
    where.status = params.status
  }

  if (params?.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: "insensitive" } },
      { user: { name: { contains: params.search, mode: "insensitive" } } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
    ]
  }

  const orderBy: Record<string, string> = {}
  const sortField = params?.sortBy ?? "createdAt"
  const sortDir = params?.sortOrder ?? "desc"
  orderBy[sortField] = sortDir

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: where as any,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: orderBy as any,
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where: where as any }),
  ])

  return {
    items: items.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      currency: o.currency,
      createdAt: o.createdAt,
      customer: o.user,
      itemCount: o._count.items,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getAdminOrderById(id: string) {
  const user = await requireRole("super_admin", "admin", "sales_manager", "customer_support")

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: { orderBy: { id: "asc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payment: {
        include: { transactions: { orderBy: { createdAt: "desc" } } },
      },
    },
  })

  if (!order) {
    return { success: false, message: "Order not found" }
  }

  return {
    success: true,
    data: {
      ...order,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      total: Number(order.total),
      items: order.items.map((i) => ({
        ...i,
        price: Number(i.price),
        total: Number(i.total),
      })),
      payment: order.payment
        ? {
            ...order.payment,
            amount: Number(order.payment.amount),
            transactions: order.payment.transactions.map((t) => ({
              ...t,
              amount: Number(t.amount),
            })),
          }
        : null,
    },
  }
}

export async function updateOrderStatus(
  id: string,
  data: z.infer<typeof updateOrderStatusSchema>
) {
  const user = await requireRole("super_admin", "admin", "sales_manager", "customer_support")

  const validated = updateOrderStatusSchema.parse(data)

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, status: true, userId: true },
  })

  if (!order) {
    return { success: false, message: "Order not found" }
  }

  if (!isValidTransition(order.status, validated.status)) {
    return {
      success: false,
      message: `Cannot transition from ${order.status} to ${validated.status}`,
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.order.update({
      where: { id },
      data: { status: validated.status },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status: validated.status,
        changedBy: user.id,
        note: validated.note ?? null,
      },
    })

    if (validated.status === "Paid") {
      const paymentRecord = await tx.payment.findUnique({ where: { orderId: id } })
      if (paymentRecord) {
        await tx.payment.update({
          where: { orderId: id },
          data: { status: "Paid", paidAt: new Date() },
        })
        await tx.paymentTransaction.create({
          data: {
            paymentId: paymentRecord.id,
            status: "Paid",
            amount: paymentRecord.amount,
            reference: paymentRecord.reference,
            metadata: JSON.stringify({ changedBy: user.id, note: validated.note ?? "Manual status update" }),
          },
        })
      }

      await commitInventoryForOrder(tx as any, id, order.orderNumber)
    }

    if (validated.status === "Refunded") {
      await releaseInventoryForOrder(tx as any, id, order.orderNumber)
    }

    return changed
  })

  await logAuditEvent({
    userId: user.id,
    action: "STATUS_CHANGE",
    entity: "order",
    entityId: id,
    description: `Order ${order.orderNumber}: ${order.status} → ${validated.status}`,
    metadata: { from: order.status, to: validated.status, note: validated.note },
  })

  revalidatePath("/admin/dashboard/orders")
  revalidatePath(`/admin/dashboard/orders/${id}`)
  revalidatePath(`/account/orders/${id}`)

  return {
    success: true,
    message: `Order status updated to ${validated.status}`,
    data: { status: updated.status },
  }
}

export async function cancelOrder(id: string) {
  const user = await requireAuth()

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, status: true, userId: true },
  })

  if (!order) {
    return { success: false, message: "Order not found" }
  }

  if (order.userId !== user.id && !["super_admin", "admin"].includes(user.role ?? "")) {
    return { success: false, message: "Forbidden" }
  }

  if (order.status !== "Pending") {
    return { success: false, message: `Cannot cancel order in ${order.status} status` }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.order.update({
      where: { id },
      data: { status: "Cancelled" },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status: "Cancelled",
        changedBy: user.id,
        note: "Cancelled by customer",
      },
    })

    await releaseInventoryForOrder(tx as any, id, order.orderNumber)

    const paymentRecord = await tx.payment.findUnique({ where: { orderId: id } })
      if (paymentRecord) {
        await tx.payment.update({
          where: { orderId: id },
          data: { status: "Cancelled", gatewayStatus: "cancelled" },
        })
        await tx.paymentTransaction.create({
          data: {
            paymentId: paymentRecord.id,
            status: "Cancelled",
            amount: paymentRecord.amount,
            reference: paymentRecord.reference,
            metadata: JSON.stringify({ cancelledBy: user.id }),
          },
        })
      }

    return changed
  })

  await logAuditEvent({
    userId: user.id,
    action: "STATUS_CHANGE",
    entity: "order",
    entityId: id,
    description: `Order ${order.orderNumber} cancelled`,
    metadata: { from: order.status, to: "Cancelled" },
  })

  revalidatePath("/account/orders")
  revalidatePath(`/account/orders/${id}`)
  revalidatePath("/admin/dashboard/orders")

  return {
    success: true,
    message: "Order cancelled successfully",
    data: { status: updated.status },
  }
}
