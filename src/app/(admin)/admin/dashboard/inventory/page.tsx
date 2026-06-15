import Link from "next/link"
import { getInventoryList, getInventoryAnalytics } from "@/features/inventory/actions/inventory"
import { getWarehouses } from "@/features/inventory/actions/warehouse"
import { InventoryTable } from "@/features/inventory/components/inventory-table"
import { InventoryAnalyticsCards } from "@/features/inventory/components/inventory-analytics-cards"
import { requireAuth } from "@/lib/auth/session"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = { title: "Inventory | Admin" }

type Props = { searchParams: Promise<{ [key: string]: string | undefined }> }

export default async function InventoryPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const page = parseInt(sp.page || "1")
  const search = sp.search || ""
  const warehouseId = sp.warehouseId || ""
  const lowStock = sp.lowStock === "true"
  const sortBy = sp.sortBy || "product.name"
  const sortOrder = (sp.sortOrder || "asc") as "asc" | "desc"

  const [analytics, warehouses, inventory] = await Promise.all([
    getInventoryAnalytics(),
    getWarehouses({ pageSize: 100 }),
    getInventoryList({ page, pageSize: 20, search, warehouseId: warehouseId || undefined, lowStock, sortBy, sortOrder }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">{inventory.total} total SKUs</p>
        </div>
        <Link href="/admin/dashboard/inventory/movements" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <TrendingUp className="h-4 w-4" /> View Movements
        </Link>
      </div>

      <InventoryAnalyticsCards data={analytics} />

      <form className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="search" placeholder="Search by product name or SKU..." defaultValue={search} className="pl-9" />
        </div>
        <select name="warehouseId" defaultValue={warehouseId} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All Warehouses</option>
          {warehouses.items.map((w: { id: string; name: string }) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="lowStock" value="true" defaultChecked={lowStock} className="h-4 w-4 rounded border-gray-300" />
          Low Stock Only
        </label>
        <button type="submit" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Filter</button>
      </form>

      <InventoryTable items={inventory.items as any} />

      {inventory.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: inventory.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/dashboard/inventory?page=${p}&search=${search}&warehouseId=${warehouseId}&lowStock=${lowStock}`}
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
