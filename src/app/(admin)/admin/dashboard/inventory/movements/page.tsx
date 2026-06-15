import Link from "next/link"
import { getInventoryMovements } from "@/features/inventory/actions/inventory"
import { getWarehouses } from "@/features/inventory/actions/warehouse"
import { MovementHistoryTable } from "@/features/inventory/components/movement-history-table"
import { requireAuth } from "@/lib/auth/session"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = { title: "Inventory Movements | Admin" }

type Props = { searchParams: Promise<{ [key: string]: string | undefined }> }

const movementTypes = ["", "STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "TRANSFER", "RESERVED", "RELEASED"]

export default async function MovementsPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const page = parseInt(sp.page || "1")
  const search = sp.search || ""
  const type = sp.type || ""
  const warehouseId = sp.warehouseId || ""
  const fromDate = sp.fromDate || ""
  const toDate = sp.toDate || ""
  const sortBy = sp.sortBy || "createdAt"
  const sortOrder = (sp.sortOrder || "desc") as "asc" | "desc"

  const [movements, warehouses] = await Promise.all([
    getInventoryMovements({ page, pageSize: 50, search, type: type || undefined, warehouseId: warehouseId || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined, sortBy, sortOrder }),
    getWarehouses({ pageSize: 100 }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/dashboard/inventory" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Inventory
        </Link>
        <h1 className="text-3xl font-bold">Inventory Movements</h1>
        <p className="text-muted-foreground mt-1">{movements.total} total movements</p>
      </div>

      <form className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="search" placeholder="Search by product, SKU, reference..." defaultValue={search} className="pl-9" />
        </div>
        <select name="type" defaultValue={type} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          {movementTypes.map((t) => (
            <option key={t} value={t}>{t || "All Types"}</option>
          ))}
        </select>
        <select name="warehouseId" defaultValue={warehouseId} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All Warehouses</option>
          {warehouses.items.map((w: { id: string; name: string }) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <Input name="fromDate" type="date" defaultValue={fromDate} className="w-40" placeholder="From" />
        <Input name="toDate" type="date" defaultValue={toDate} className="w-40" placeholder="To" />
        <button type="submit" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Filter</button>
      </form>

      <MovementHistoryTable items={movements.items as any} />

      {movements.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: movements.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/dashboard/inventory/movements?page=${p}&search=${search}&type=${type}&warehouseId=${warehouseId}&fromDate=${fromDate}&toDate=${toDate}`}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                p === page ? "bg-primary text-primary-foreground" : "border border-input bg-background hover:bg-accent"
              }`}
            >{p}</Link>
          ))}
        </div>
      )}
    </div>
  )
}
