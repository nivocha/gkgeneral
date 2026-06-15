import Link from "next/link"
import { getAdminPayments } from "@/features/payments/actions/get-payments"
import { PaymentTable } from "@/features/payments/components/payment-table"
import type { PaymentTableRow } from "@/features/payments/components/payment-table"
import { requireAuth } from "@/lib/auth/session"
import { PaymentStatus } from "@/lib/prisma"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Payments | Admin",
}

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
  await requireAuth()

  const sp = await searchParams
  const page = parseInt(sp.page || "1")
  const status = sp.status || "all"
  const search = sp.search || ""
  const sortBy = sp.sortBy || "createdAt"
  const sortOrder = (sp.sortOrder || "desc") as "asc" | "desc"

  const validStatus = status as PaymentStatus | "all"

  const result = await getAdminPayments({
    page,
    pageSize: 20,
    status: validStatus,
    search,
    sortBy,
    sortOrder,
  })

  const statuses = ["all", "Pending", "Processing", "Paid", "Failed", "Refunded", "Cancelled"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground mt-1">{result.total} total payments</p>
      </div>

      <form className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search by reference, order, customer..."
            defaultValue={search}
            className="pl-9"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          Filter
        </button>
      </form>

      <PaymentTable items={result.items as PaymentTableRow[]} isAdmin />

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/dashboard/payments?page=${p}&status=${status}&search=${search}`}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-background hover:bg-accent"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
