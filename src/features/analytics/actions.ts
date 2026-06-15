"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/session"
import { startOfDay, subDays, startOfWeek, startOfMonth, format } from "date-fns"

export type RevenueAnalytics = {
  daily: { date: string; revenue: number; orders: number }[]
  weekly: { week: string; revenue: number; orders: number }[]
  monthly: { month: string; revenue: number; orders: number }[]
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
}

export type ProductAnalytics = {
  topProducts: { name: string; revenue: number; quantity: number }[]
  topCategories: { name: string; revenue: number; quantity: number }[]
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  deadStockCount: number
}

export type CustomerAnalytics = {
  totalCustomers: number
  repeatCustomers: number
  repeatRate: number
  topCustomers: { name: string; email: string; totalSpent: number; orderCount: number }[]
  averageLifetimeValue: number
}

export async function getRevenueAnalytics(): Promise<RevenueAnalytics> {
  await requireRole("super_admin", "admin")

  const thirtyDaysAgo = subDays(new Date(), 30)
  const orders = await prisma.order.findMany({
    where: { status: { in: ["Paid", "Delivered"] }, createdAt: { gte: thirtyDaysAgo } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const dailyMap = new Map<string, { revenue: number; orders: number }>()
  const weeklyMap = new Map<string, { revenue: number; orders: number }>()
  const monthlyMap = new Map<string, { revenue: number; orders: number }>()

  let totalRevenue = 0
  for (const order of orders) {
    const amount = Number(order.total)
    totalRevenue += amount

    const day = format(startOfDay(order.createdAt), "yyyy-MM-dd")
    const week = format(startOfWeek(order.createdAt, { weekStartsOn: 1 }), "yyyy-MM-dd")
    const month = format(startOfMonth(order.createdAt), "yyyy-MM")

    const d = dailyMap.get(day) || { revenue: 0, orders: 0 }
    d.revenue += amount; d.orders += 1
    dailyMap.set(day, d)

    const w = weeklyMap.get(week) || { revenue: 0, orders: 0 }
    w.revenue += amount; w.orders += 1
    weeklyMap.set(week, w)

    const m = monthlyMap.get(month) || { revenue: 0, orders: 0 }
    m.revenue += amount; m.orders += 1
    monthlyMap.set(month, m)
  }

  return {
    daily: Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data })),
    weekly: Array.from(weeklyMap.entries()).map(([week, data]) => ({ week, ...data })),
    monthly: Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data })),
    totalRevenue,
    totalOrders: orders.length,
    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
  }
}

export async function getProductAnalytics(): Promise<ProductAnalytics> {
  await requireRole("super_admin", "admin")

  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId", "name"],
    _sum: { total: true, quantity: true },
    orderBy: { _sum: { total: "desc" } },
    take: 10,
  })

  const topCategories = await prisma.$queryRawUnsafe<any[]>(
    `SELECT c.name, SUM(oi.total) as revenue, SUM(oi.quantity) as quantity
     FROM "OrderItem" oi
     JOIN "Product" p ON p.id = oi."productId"
     JOIN "Category" c ON c.id = p."categoryId"
     GROUP BY c.name
     ORDER BY revenue DESC LIMIT 10`
  )

  const [totalProducts, inventories] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.inventory.findMany({ select: { quantity: true, reservedQuantity: true, minStockLevel: true } }),
  ])

  let lowStockCount = 0
  let outOfStockCount = 0
  let deadStockCount = 0
  for (const inv of inventories) {
    const available = inv.quantity - inv.reservedQuantity
    if (available <= 0) outOfStockCount++
    else if (available <= inv.minStockLevel) lowStockCount++
    if (inv.quantity > 0 && available === inv.quantity) deadStockCount++
  }

  return {
    topProducts: topProducts.map((p) => ({
      name: p.name,
      revenue: Number(p._sum.total || 0),
      quantity: p._sum.quantity || 0,
    })),
    topCategories: topCategories.map((c: any) => ({
      name: c.name,
      revenue: Number(c.revenue || 0),
      quantity: Number(c.quantity || 0),
    })),
    totalProducts,
    lowStockCount,
    outOfStockCount,
    deadStockCount,
  }
}

export async function getCustomerAnalytics(): Promise<CustomerAnalytics> {
  await requireRole("super_admin", "admin")

  const customers = await prisma.user.findMany({
    where: { role: "customer" },
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { orders: true } },
    },
  })

  const totalCustomers = customers.length
  const repeatCustomers = customers.filter((c) => c._count.orders > 1).length
  const activeCustomers = customers.filter((c) => c._count.orders > 0)

  const orderTotals = await prisma.$queryRawUnsafe<any[]>(
    `SELECT u.id, u.name, u.email,
            COUNT(o.id) as "orderCount",
            COALESCE(SUM(o.total), 0) as "totalSpent"
     FROM "User" u
     JOIN "Order" o ON o."userId" = u.id
     WHERE u.role = 'customer' AND o.status IN ('Paid', 'Delivered')
     GROUP BY u.id, u.name, u.email
     ORDER BY "totalSpent" DESC LIMIT 10`
  )

  const totalRevenue = orderTotals.reduce((s, c) => s + Number(c.totalSpent || 0), 0)

  return {
    totalCustomers,
    repeatCustomers,
    repeatRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
    topCustomers: orderTotals.map((c: any) => ({
      name: c.name,
      email: c.email,
      totalSpent: Number(c.totalSpent || 0),
      orderCount: Number(c.orderCount || 0),
    })),
    averageLifetimeValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
  }
}
