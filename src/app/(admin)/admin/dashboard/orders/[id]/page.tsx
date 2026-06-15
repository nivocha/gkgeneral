import { notFound } from "next/navigation"
import Link from "next/link"
import { getAdminOrderById } from "@/features/orders/actions"
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge"
import { OrderItemsTable } from "@/features/orders/components/order-items-table"
import { OrderStatusTimeline } from "@/features/orders/components/order-status-timeline"
import { AdminOrderStatusDropdown } from "@/features/orders/components/admin-order-status-dropdown"
import { requireAuth } from "@/lib/auth/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDateTime, formatDate } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Order Detail | Admin",
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const result = await getAdminOrderById(id)

  if (!result.success) notFound()

  const order = result.data!

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dashboard/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <AdminOrderStatusDropdown orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsTable items={order.items} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusTimeline history={order.statusHistory} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.user.name}</p>
              <p className="text-muted-foreground">{order.user.email}</p>
              {order.user.phone && <p className="text-muted-foreground">{order.user.phone}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (18%)</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {order.payment && (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="capitalize">{order.payment.method.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">{order.payment.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>{formatPrice(order.payment.amount)}</span>
                </div>
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid At</span>
                    <span>{formatDateTime(order.payment.paidAt)}</span>
                  </div>
                )}
                {order.payment.transactions.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Transactions</p>
                    {order.payment.transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">{tx.status}</span>
                        <span className="font-mono">{tx.reference ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(order.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
