import { notFound } from "next/navigation"
import Link from "next/link"
import { getCustomerPaymentById } from "@/features/payments/actions/get-payments"
import { PaymentStatusBadge } from "@/features/payments/components/payment-status-badge"
import { TransactionHistory } from "@/features/payments/components/transaction-history"
import { requireAuth } from "@/lib/auth/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatPrice, formatDateTime } from "@/lib/utils"
import { ChevronLeft, Receipt } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Payment Detail | Account",
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function CustomerPaymentDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const result = await getCustomerPaymentById(id)

  if (!result.success) notFound()

  const payment = result.data!
  const order = payment.order

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/payments"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Payments
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-mono">
              {payment.reference ?? "Payment"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Created on {formatDateTime(payment.createdAt)}
            </p>
          </div>
          <PaymentStatusBadge status={payment.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionHistory transactions={payment.transactions} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <PaymentStatusBadge status={payment.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatPrice(payment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{payment.method.replace(/_/g, " ")}</span>
              </div>
              <Separator />
              {payment.reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{payment.reference}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid At</span>
                  <span>{formatDateTime(payment.paidAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link
                href={`/account/orders/${order.id}`}
                className="font-mono font-medium text-primary hover:underline"
              >
                {order.orderNumber}
              </Link>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center py-4">
              <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {payment.paidAt
                  ? "Payment completed"
                  : "Payment pending or not yet completed"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
