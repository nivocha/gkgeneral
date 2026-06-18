import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/currency"
import { formatDateTime } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { PrintButton } from "./client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: { order: { select: { orderNumber: true } } },
  })
  return {
    title: link ? `Payment - ${link.order.orderNumber} | GK General Supply` : "Payment | GK General Supply",
  }
}

async function getPaymentData(token: string) {
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: {
      order: {
        include: {
          payment: {
            include: {
              transactions: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
          items: {
            include: { product: { select: { name: true, slug: true } } },
          },
        },
      },
    },
  })
  if (!link || link.status === "Expired") return null
  const order = link.order
  const payment = order.payment
  const txn = payment?.transactions?.[0]
  const status = payment?.status ?? "Pending"
  return {
    orderNumber: order.orderNumber,
    total: Number(order.total),
    currency: order.currency,
    createdAt: order.createdAt,
    status,
    paidAt: payment?.paidAt ?? null,
    reference: payment?.reference ?? txn?.reference ?? null,
    transactionRef: payment?.transactionReference ?? (typeof txn?.providerPayload === "object" && txn?.providerPayload !== null ? (txn.providerPayload as Record<string, unknown>)?.transaction_id as string : null) ?? null,
    gatewayStatus: payment?.gatewayStatus ?? txn?.status ?? null,
    cardType: payment?.cardType ?? null,
    cardMasked: payment?.cardMasked ?? null,
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: Number(i.price),
      total: Number(i.total),
    })),
  }
}

export default async function PaySuccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getPaymentData(token)
  if (!data) notFound()

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4" id="receipt">
      <div className="text-center mb-8">
        <div className="rounded-full bg-green-100 dark:bg-green-900/20 h-20 w-20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Payment {data.status === "Paid" ? "Successful" : "Initiated"}</h1>
        <p className="text-muted-foreground mt-1">Order #{data.orderNumber}</p>
      </div>

      <Card className="mb-6 print:shadow-none print:border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Receipt</CardTitle>
          <PrintButton />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b pb-3">
            <h2 className="font-semibold text-lg">GK General Supply</h2>
            <p className="text-sm text-muted-foreground">Power &amp; Industrial Equipment Supplier</p>
            <p className="text-sm text-muted-foreground">Dar es Salaam, Tanzania</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Order Number</p>
              <p className="font-mono font-medium">{data.orderNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p>{formatDateTime(data.createdAt)}</p>
            </div>
            {data.paidAt && (
              <div>
                <p className="text-muted-foreground">Paid At</p>
                <p>{formatDateTime(data.paidAt)}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className={data.status === "Paid" ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                {data.status}
              </p>
            </div>
          </div>

          <div className="border-t pt-3">
            <h3 className="font-semibold mb-2">Items</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Price</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1">{item.name}</td>
                    <td className="text-center py-1">{item.quantity}</td>
                    <td className="text-right py-1">{formatPrice(item.price, data.currency)}</td>
                    <td className="text-right py-1 font-medium">{formatPrice(item.total, data.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t pt-3 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(data.total, data.currency)}</span>
          </div>

          {data.transactionRef && (
            <div className="border-t pt-3 text-sm">
              <p className="text-muted-foreground">Transaction Reference</p>
              <p className="font-mono text-xs break-all">{data.transactionRef}</p>
            </div>
          )}
          {data.reference && (
            <div className="text-sm">
              <p className="text-muted-foreground">Payment Reference</p>
              <p className="font-mono text-xs break-all">{data.reference}</p>
            </div>
          )}
          {data.cardMasked && (
            <div className="text-sm">
              <p className="text-muted-foreground">Card</p>
              <p>{data.cardType} **** {data.cardMasked}</p>
            </div>
          )}
          {data.gatewayStatus && data.status !== "Paid" && (
            <p className="text-sm text-amber-600">Gateway status: {data.gatewayStatus}</p>
          )}
        </CardContent>
      </Card>

      <div className="text-center space-x-4">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild>
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  )
}
