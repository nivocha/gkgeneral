import Link from "next/link"
import { getAdminQuotes, updateQuoteStatus } from "@/features/quotations/actions/manage-quotes"
import { requireAuth } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { title: "Quotes | Admin" }

type Props = { searchParams: Promise<{ [key: string]: string | undefined }> }

export default async function AdminQuotesPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const page = parseInt(sp.page || "1", 10)
  const status = sp.status || "all"

  const result = await getAdminQuotes(page, 20, status)

  const statuses = ["all", "Draft", "Submitted", "Reviewing", "Approved", "Rejected", "Converted"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground mt-1">{result.total} total quotes</p>
        </div>
      </div>

      <form className="flex gap-3">
        <select name="status" defaultValue={status} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          {statuses.map((s) => (<option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>))}
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div className="col-span-2">Quote #</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2 text-center">Items</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1 text-right">Action</div>
        </div>
        <div className="divide-y">
          {result.items.map((q) => (
            <div key={q.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30">
              <div className="col-span-2 font-mono font-medium">{q.quoteNumber}</div>
              <div className="col-span-3 truncate">{q.user.name}<br /><span className="text-xs text-muted-foreground">{q.user.email}</span></div>
              <div className="col-span-2 text-center">{q.items.length}</div>
              <div className="col-span-2 text-center">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  q.status === "Approved" ? "bg-green-100 text-green-800" :
                  q.status === "Rejected" ? "bg-red-100 text-red-800" :
                  q.status === "Reviewing" ? "bg-blue-100 text-blue-800" :
                  q.status === "Converted" ? "bg-emerald-100 text-emerald-800" :
                  "bg-amber-100 text-amber-800"
                }`}>{q.status}</span>
              </div>
              <div className="col-span-2 text-muted-foreground text-xs">{formatDate(q.createdAt)}</div>
              <div className="col-span-1 text-right">
                <Link href={`/admin/dashboard/quotes/${q.id}`}><ExternalLink className="h-4 w-4 inline text-muted-foreground" /></Link>
              </div>
            </div>
          ))}
          {result.items.length === 0 && <div className="px-4 py-12 text-center text-muted-foreground">No quotes found</div>}
            </div>
          </div>
        </div>
      </div>

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/dashboard/quotes?page=${p}&status=${status}`}
              className={`inline-flex rounded-md px-3 py-1.5 text-sm ${p === page ? "bg-primary text-primary-foreground" : "border hover:bg-accent"}`}>{p}</Link>
          ))}
        </div>
      )}
    </div>
  )
}
