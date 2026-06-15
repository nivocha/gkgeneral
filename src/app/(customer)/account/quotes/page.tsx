import Link from "next/link"
import { getCustomerQuotes } from "@/features/quotations/actions/manage-quotes"
import { requireAuth } from "@/lib/auth/session"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { title: "My Quotes | Account" }

type Props = { searchParams: Promise<{ page?: string }> }

export default async function QuotesPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const page = parseInt(sp.page ?? "1", 10) || 1
  const result = await getCustomerQuotes(page)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Quotes</h1>
          <p className="text-muted-foreground mt-1">{result.total > 0 ? `${result.total} quote${result.total !== 1 ? "s" : ""}` : "No quotes yet"}</p>
        </div>
      </div>

      {result.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quotes yet</h3>
            <p className="text-muted-foreground mb-6">Request a quote for bulk or custom orders.</p>
            <Link href="/products" className={buttonVariants()}>Browse Products</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {result.items.map((q) => (
            <Link key={q.id} href={`/account/quotes/${q.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-sm font-semibold">{q.quoteNumber}</p>
                      <p className="text-sm text-muted-foreground">{q.items.length} item{q.items.length !== 1 ? "s" : ""}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        q.status === "Approved" ? "bg-green-100 text-green-800" :
                        q.status === "Rejected" ? "bg-red-100 text-red-800" :
                        q.status === "Reviewing" ? "bg-blue-100 text-blue-800" :
                        q.status === "Converted" ? "bg-emerald-100 text-emerald-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>{q.status}</span>
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
          {page > 1 && <Link href={`/account/quotes?page=${page - 1}`} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Previous</Link>}
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/account/quotes?page=${p}`}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm ${p === page ? "bg-primary text-primary-foreground" : "border hover:bg-accent"}`}>{p}</Link>
          ))}
          {page < result.totalPages && <Link href={`/account/quotes?page=${page + 1}`} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Next</Link>}
        </div>
      )}
    </div>
  )
}
