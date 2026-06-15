"use server"

import { prisma, PaymentStatus } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth/session"

export async function getCustomerPayments(params?: {
  page?: number
  pageSize?: number
}) {
  const user = await requireAuth()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params?.pageSize ?? 10))
  const skip = (page - 1) * pageSize

  const where = { order: { userId: user.id } }

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        method: true,
        reference: true,
        transactionReference: true,
        paidAt: true,
        gatewayStatus: true,
        createdAt: true,
        order: {
          select: { id: true, orderNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ])

  return {
    items: items.map((p) => ({
      id: p.id,
      status: p.status,
      amount: Number(p.amount),
      currency: p.currency,
      method: p.method,
      reference: p.reference,
      transactionReference: p.transactionReference,
      paidAt: p.paidAt,
      gatewayStatus: p.gatewayStatus,
      createdAt: p.createdAt,
      orderId: p.order.id,
      orderNumber: p.order.orderNumber,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getCustomerPaymentById(id: string) {
  const user = await requireAuth()

  const payment = await prisma.payment.findFirst({
    where: { id, order: { userId: user.id } },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      transactions: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!payment) {
    return { success: false, message: "Payment not found" }
  }

  return {
    success: true,
    data: {
      ...payment,
      amount: Number(payment.amount),
      transactions: payment.transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    },
  }
}

export async function getAdminPayments(params?: {
  page?: number
  pageSize?: number
  status?: PaymentStatus | "all"
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}) {
  await requireRole("super_admin", "admin", "sales_manager", "customer_support")

  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}

  if (params?.status && params.status !== "all") {
    where.status = params.status
  }

  if (params?.search) {
    where.OR = [
      { reference: { contains: params.search, mode: "insensitive" } },
      { order: { orderNumber: { contains: params.search, mode: "insensitive" } } },
      { order: { user: { name: { contains: params.search, mode: "insensitive" } } } },
      { order: { user: { email: { contains: params.search, mode: "insensitive" } } } },
    ]
  }

  const orderBy: Record<string, string> = {}
  const sortField = params?.sortBy ?? "createdAt"
  const sortDir = params?.sortOrder ?? "desc"
  orderBy[sortField] = sortDir

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where: where as any,
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        method: true,
        reference: true,
        transactionReference: true,
        paidAt: true,
        gatewayStatus: true,
        createdAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: orderBy as any,
      skip,
      take: pageSize,
    }),
    prisma.payment.count({ where: where as any }),
  ])

  return {
    items: items.map((p) => ({
      id: p.id,
      status: p.status,
      amount: Number(p.amount),
      currency: p.currency,
      method: p.method,
      reference: p.reference,
      transactionReference: p.transactionReference,
      paidAt: p.paidAt,
      gatewayStatus: p.gatewayStatus,
      createdAt: p.createdAt,
      orderId: p.order.id,
      orderNumber: p.order.orderNumber,
      customer: p.order.user,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getAdminPaymentById(id: string) {
  await requireRole("super_admin", "admin", "sales_manager", "customer_support")

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          subtotal: true,
          tax: true,
          shipping: true,
          currency: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      transactions: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!payment) {
    return { success: false, message: "Payment not found" }
  }

  return {
    success: true,
    data: {
      ...payment,
      amount: Number(payment.amount),
      transactions: payment.transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    },
  }
}
