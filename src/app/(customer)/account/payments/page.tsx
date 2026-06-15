import Link from "next/link"
import { getCustomerPayments } from "@/features/payments/actions/get-payments"
import { PaymentStatusBadge } from "@/features/payments/components/payment-status-badge"
import { requireAuth } from "@/lib/auth/session"
import { Card, CardContent } from "@/components/ui/card"
import { formatPrice, formatDate } from "@/lib/utils"
import { CreditCard, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "My Payments | Account",
}

type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function CustomerPaymentsPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const page = parseInt(sp.page ?? "1", 10)
  const result = await getCustomerPayments({ page, pageSize: 10 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Payments</h1>
        <p className="text-muted-foreground mt-1">
          {result.total > 0
            ? `You have ${result.total} payment${result.total === 1 ? "" : "s"}`
            : "No payments recorded yet"}
        </p>
      </div>

      {result.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
            <p className="text-muted-foreground mb-6">
              Payments will appear here after you place an order.
            </p>
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
          {result.items.map((p) => (
            <Link key={p.id} href={`/account/payments/${p.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-muted-foreground">
                        {p.reference ?? "No reference"}
                      </p>
                      <p className="font-semibold">{formatPrice(p.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        Order {p.orderNumber} &middot; {formatDate(p.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentStatusBadge status={p.status} />
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
              href={`/account/payments?page=${page - 1}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Previous
            </Link>
          )}
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/account/payments?page=${p}`}
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
              href={`/account/payments?page=${page + 1}`}
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
