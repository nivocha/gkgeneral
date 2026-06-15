import Link from "next/link"
import { getCustomerOrders } from "@/features/orders/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/auth/session"
import { formatPrice, formatDate } from "@/lib/utils"
import { ShoppingBag, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Refunded: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function CustomerOrdersPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const page = parseInt(sp.page ?? "1", 10)
  const result = await getCustomerOrders({ page, pageSize: 10 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground mt-1">
          {result.total > 0
            ? `You have ${result.total} order${result.total === 1 ? "" : "s"}`
            : "You haven't placed any orders yet"}
        </p>
      </div>

      {result.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">Start by browsing our products and placing your first order.</p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Browse Products
          </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {result.items.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-sm text-muted-foreground">{order.orderNumber}</p>
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[order.status] ?? ""}>
                        {order.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {page > 1 && (
            <Link
              href={`/account/orders?page=${page - 1}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Previous
            </Link>
          )}
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/account/orders?page=${p}`}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {p}
            </Link>
          ))}
          {page < result.totalPages && (
            <Link
              href={`/account/orders?page=${page + 1}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
