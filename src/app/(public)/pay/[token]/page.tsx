import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPaymentLinkByToken } from "@/features/payments/actions/payment-links"
import { PayPageClient } from "./client"
import { formatPrice } from "@/lib/currency"

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const link = await getPaymentLinkByToken(token)
  if (!link) return { title: "Payment Link - Not Found" }

  return {
    title: `Pay - ${link.order.orderNumber} | GK General Supply`,
    description: `Complete your payment of ${formatTotal(link.order.total, link.order.currency)} for order ${link.order.orderNumber}`,
  }
}

function formatTotal(value: { toString: () => string }, currency?: string | null) {
  return formatPrice(Number(value), currency)
}

export default async function PayPage({ params }: Props) {
  const { token } = await params
  const link = await getPaymentLinkByToken(token)

  if (!link) notFound()
  if ("paid" in link && link.paid) {
    return (
      <div className="container max-w-lg mx-auto py-20 text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/20 h-16 w-16 flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Completed</h1>
        <p className="text-muted-foreground mb-6">
          This payment has already been processed. Thank you!
        </p>
        <p className="text-sm text-muted-foreground">
          Order: {link.order.orderNumber}
        </p>
      </div>
    )
  }

  const order = link.order
  const total = Number(order.total)

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Complete Your Payment</h1>
        <p className="text-muted-foreground mt-1">Order #{order.orderNumber}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
          <PayPageClient token={token} order={order} />
        </div>

        <div className="md:col-span-2">
          <div className="rounded-lg border bg-card p-4 space-y-3 sticky top-24">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate">
                    {item.quantity}x {item.name}
                  </span>
                    <span className="shrink-0">
                    {formatPrice(Number(item.total), order.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal), order.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{formatPrice(Number(order.shipping), order.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatPrice(Number(order.tax), order.currency)}</span>
              </div>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total, order.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
