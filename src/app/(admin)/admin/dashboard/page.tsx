import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Users, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDateTime } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const metadata = { title: "Dashboard | Admin" }

export default async function AdminDashboardPage() {
  const user = await requireRole("super_admin", "admin", "inventory_manager", "sales_manager", "customer_support")

  const [totalRevenue, totalOrders, totalCustomers, totalProducts, recentOrders, lowStock, recentActivities] =
    await Promise.all([
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ["Paid", "Shipped", "Delivered"] }, currency: "USD" } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.product.count({ where: { status: "Active" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, user: { select: { name: true } } },
      }),
      prisma.inventory.findMany({
        where: { minStockLevel: { gt: 0 } },
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { quantity: "asc" },
        take: 5,
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
    ])

  const lowStockItems = lowStock.filter((i) => (i.quantity - i.reservedQuantity) <= i.minStockLevel)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome, {user.name}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(Number(totalRevenue._sum.total) || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">No recent orders</div>
            ) : (
              <div className="divide-y">
                {recentOrders.map((o) => (
                  <Link key={o.id} href={`/admin/dashboard/orders/${o.id}`} className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-6 px-6 transition-colors">
                    <div>
                      <p className="font-mono text-sm font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{o.user.name} · {formatDateTime(o.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatPrice(Number(o.total))}</p>
                      <Badge variant="outline" className="text-xs">{o.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">No low stock alerts</div>
            ) : (
              <div className="divide-y">
                {lowStockItems.map((i) => (
                  <div key={i.id} className="py-3">
                    <p className="text-sm font-medium">{i.product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {i.product.sku} · Qty: {i.quantity - i.reservedQuantity}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">No recent activities</div>
            ) : (
              <div className="divide-y">
                {recentActivities.map((a) => (
                  <div key={a.id} className="py-2 text-sm">
                    <span className="text-muted-foreground">{a.user?.name || "System"}</span>
                    <span> {a.description || `${a.action} ${a.entity}`}</span>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
