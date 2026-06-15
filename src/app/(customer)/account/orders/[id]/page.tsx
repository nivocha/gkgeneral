import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getCustomerOrderById, cancelOrder } from "@/features/orders/actions"
import { requireAuth } from "@/lib/auth/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatPrice, formatDate, formatDateTime } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"
import CancelOrderButton from "@/components/cancel-order-button"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Refunded: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

async function handleCancel(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  await cancelOrder(id)
  redirect(`/account/orders/${id}`)
}

export default async function CustomerOrderDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const result = await getCustomerOrderById(id)

  if (!result.success) notFound()

  const order = result.data!

  const canCancel = order.status === "Pending"

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-mono">{order.orderNumber}</h1>
            <p className="text-muted-foreground mt-1">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <Badge className={`text-sm px-3 py-1 ${statusColors[order.status] ?? ""}`}>
            {order.status}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[640px] divide-y">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground pb-2">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2">SKU</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {order.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 py-3 text-sm">
                    <div className="col-span-5 font-medium">{item.name}</div>
                    <div className="col-span-2 text-muted-foreground font-mono">{item.sku}</div>
                    <div className="col-span-2 text-right">{formatPrice(item.price)}</div>
                    <div className="col-span-1 text-center">{item.quantity}</div>
                    <div className="col-span-2 text-right font-medium">{formatPrice(item.total)}</div>
                  </div>
                ))}
              </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((h) => (
                  <div key={h.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${statusColors[h.status]?.split(" ")[0] ?? "bg-muted"}`} />
                      <div className="w-px flex-1 bg-border mt-1" />
                    </div>
                    <div className="pb-4">
                      <div className="font-medium">
                        <Badge className={statusColors[h.status] ?? ""}>{h.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDateTime(h.createdAt)}</p>
                      {h.note && <p className="text-sm text-muted-foreground mt-1">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid At</span>
                    <span>{formatDateTime(order.payment.paidAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {canCancel && (
            <form action={handleCancel}>
              <input type="hidden" name="id" value={order.id} />
              <CancelOrderButton />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
