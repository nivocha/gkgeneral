import { notFound } from "next/navigation"
import Link from "next/link"
import { getAdminQuote, updateQuoteStatus } from "@/features/quotations/actions/manage-quotes"
import { requireAuth } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { title: "Quote Detail | Admin" }

type Props = { params: Promise<{ id: string }> }

export default async function AdminQuoteDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  let quote
  try {
    quote = await getAdminQuote(id)
  } catch { notFound() }

  const transitions: Record<string, string[]> = {
    Draft: ["Submitted"],
    Submitted: ["Reviewing", "Rejected"],
    Reviewing: ["Approved", "Rejected", "Submitted"],
    Approved: ["Converted", "Rejected"],
    Rejected: [],
    Converted: [],
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/dashboard/quotes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Quotes
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">{quote.quoteNumber}</h1>
          <p className="text-muted-foreground mt-1">Created {formatDateTime(quote.createdAt)}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
          quote.status === "Approved" ? "bg-green-100 text-green-800" :
          quote.status === "Rejected" ? "bg-red-100 text-red-800" :
          quote.status === "Reviewing" ? "bg-blue-100 text-blue-800" :
          "bg-amber-100 text-amber-800"
        }`}>{quote.status}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y">
                {quote.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-3">
                    <div>
                      <Link href={`/products/${item.product.slug}`} className="font-medium hover:text-primary">{item.name}</Link>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku} &middot; Qty: {item.quantity}</p>
                      {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">Name:</span> {quote.user.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {quote.user.email}</p>
              {quote.user.phone && <p><span className="text-muted-foreground">Phone:</span> {quote.user.phone}</p>}
            </CardContent>
          </Card>

          {(transitions[quote.status]?.length ?? 0) > 0 && (
            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {transitions[quote.status]?.map((nextStatus) => (
                  <form key={nextStatus} action={updateQuoteStatus}>
                    <input type="hidden" name="id" value={quote.id} />
                    <input type="hidden" name="status" value={nextStatus} />
                    <Button type="submit" variant={nextStatus === "Approved" ? "default" : nextStatus === "Rejected" ? "destructive" : "outline"} className="w-full">
                      Mark as {nextStatus}
                    </Button>
                  </form>
                ))}
              </CardContent>
            </Card>
          )}

          {quote.validUntil && (
            <p className="text-sm text-muted-foreground">Valid until: {formatDate(quote.validUntil)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
