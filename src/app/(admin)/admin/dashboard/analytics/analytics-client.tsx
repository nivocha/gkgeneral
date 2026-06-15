"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import type { RevenueAnalytics, ProductAnalytics, CustomerAnalytics } from "@/features/analytics/actions"

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"]

type Props = {
  revenue: RevenueAnalytics | null
  products: ProductAnalytics | null
  customers: CustomerAnalytics | null
}

export function AnalyticsClient({ revenue, products, customers }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(revenue?.totalRevenue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Orders (30d)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{revenue?.totalOrders || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Order Value</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(revenue?.averageOrderValue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Customers</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers?.totalCustomers || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader><CardTitle>Daily Revenue (30 days)</CardTitle></CardHeader>
        <CardContent>
          {revenue?.daily && revenue.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => formatPrice(Number(value))} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground">No revenue data yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Product Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Low Stock / Out of Stock</CardTitle></CardHeader>
          <CardContent>
            {products ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Products</span>
                  <span className="font-bold">{products.totalProducts}</span>
                </div>
                <div className="flex justify-between text-amber-600">
                  <span>Low Stock</span>
                  <span className="font-bold">{products.lowStockCount}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Out of Stock</span>
                  <span className="font-bold">{products.outOfStockCount}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>No Movement (Dead Stock)</span>
                  <span className="font-bold">{products.deadStockCount}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No product data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Products by Revenue</CardTitle></CardHeader>
          <CardContent>
            {products?.topProducts && products.topProducts.length > 0 ? (
              <div className="space-y-2">
                {products.topProducts.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{p.name}</span>
                    <span className="font-medium whitespace-nowrap">{formatPrice(p.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No sales data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Customer Insights</CardTitle></CardHeader>
          <CardContent>
            {customers ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Customers</span>
                  <span className="font-bold">{customers.totalCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Repeat Customers</span>
                  <span className="font-bold">{customers.repeatCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Repeat Rate</span>
                  <span className="font-bold">{customers.repeatRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Lifetime Value</span>
                  <span className="font-bold">{formatPrice(customers.averageLifetimeValue)}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No customer data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
          <CardContent>
            {customers?.topCustomers && customers.topCustomers.length > 0 ? (
              <div className="space-y-2">
                {customers.topCustomers.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{c.name}</span>
                    <span className="font-medium whitespace-nowrap">{formatPrice(c.totalSpent)} ({c.orderCount} orders)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No customer data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
