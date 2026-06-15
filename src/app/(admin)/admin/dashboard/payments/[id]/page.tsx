import { notFound } from "next/navigation"
import Link from "next/link"
import { getAdminPaymentById } from "@/features/payments/actions/get-payments"
import { refundPayment } from "@/features/payments/actions/refund-payment"
import { PaymentStatusBadge } from "@/features/payments/components/payment-status-badge"
import { TransactionHistory } from "@/features/payments/components/transaction-history"
import { requireAuth } from "@/lib/auth/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDateTime } from "@/lib/utils"
import { ChevronLeft, RotateCcw } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Payment Detail | Admin",
}

type Props = {
  params: Promise<{ id: string }>
}

async function handleRefund(formData: FormData) {
  "use server"
  const paymentId = formData.get("paymentId") as string
  const reason = formData.get("reason") as string | null
  await refundPayment(paymentId, reason ?? undefined)
}

export default async function AdminPaymentDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const result = await getAdminPaymentById(id)

  if (!result.success) notFound()

  const payment = result.data!
  const order = payment.order
  const canRefund = payment.status === "Paid"

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dashboard/payments"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Payments
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-mono">{payment.reference ?? "No Reference"}</h1>
            <p className="text-muted-foreground text-sm mt-1">
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
                <span className="text-muted-foreground">Currency</span>
                <span>{payment.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{payment.method.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{payment.reference ?? "—"}</span>
              </div>
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
                href={`/admin/dashboard/orders/${order.id}`}
                className="font-mono font-medium text-primary hover:underline"
              >
                {order.orderNumber}
              </Link>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Status</span>
                <Badge variant="outline">{order.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

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

          {canRefund && (
            <Card>
              <CardHeader>
                <CardTitle>Refund</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={handleRefund} className="space-y-3">
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <div>
                    <label htmlFor="reason" className="text-sm text-muted-foreground block mb-1">
                      Reason (optional)
                    </label>
                    <input
                      id="reason"
                      name="reason"
                      placeholder="Reason for refund..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <Button variant="destructive" type="submit" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refund Payment
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Payment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono text-xs">{payment.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(payment.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDateTime(payment.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
