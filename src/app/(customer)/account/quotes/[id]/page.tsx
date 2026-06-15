import { notFound } from "next/navigation"
import Link from "next/link"
import { getCustomerQuote, cancelQuote } from "@/features/quotations/actions/manage-quotes"
import { requireAuth } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, FileText, Trash2 } from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { title: "Quote Detail | Account" }

type Props = { params: Promise<{ id: string }> }

export default async function QuoteDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  let quote
  try {
    quote = await getCustomerQuote(id)
  } catch {
    notFound()
  }

  const statusColors: Record<string, string> = {
    Draft: "bg-amber-100 text-amber-800",
    Submitted: "bg-blue-100 text-blue-800",
    Reviewing: "bg-purple-100 text-purple-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
    Converted: "bg-emerald-100 text-emerald-800",
  }

  return (
    <div className="space-y-6">
      <Link href="/account/quotes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Quotes
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono">{quote.quoteNumber}</h1>
          <p className="text-muted-foreground mt-1">Created {formatDateTime(quote.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors[quote.status] || "bg-gray-100"}`}>{quote.status}</span>
          {(quote.status === "Submitted" || quote.status === "Draft") && (
            <form action={cancelQuote}>
              <input type="hidden" name="id" value={quote.id} />
              <Button variant="outline" size="sm" type="submit"><Trash2 className="h-4 w-4 mr-1" />Cancel</Button>
            </form>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {quote.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
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

      {quote.validUntil && (
        <p className="text-sm text-muted-foreground">Valid until: {formatDate(quote.validUntil)}</p>
      )}
      {quote.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{quote.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
