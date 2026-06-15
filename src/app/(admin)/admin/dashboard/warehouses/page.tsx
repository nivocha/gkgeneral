import Link from "next/link"
import { getWarehouses } from "@/features/inventory/actions/warehouse"
import { WarehouseTable } from "@/features/inventory/components/warehouse-table"
import { requireAuth } from "@/lib/auth/session"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = { title: "Warehouses | Admin" }

type Props = { searchParams: Promise<{ [key: string]: string | undefined }> }

export default async function WarehousesPage({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const page = parseInt(sp.page || "1")
  const search = sp.search || ""
  const sortBy = sp.sortBy || "name"
  const sortOrder = (sp.sortOrder || "asc") as "asc" | "desc"

  const result = await getWarehouses({ page, pageSize: 20, search, sortBy, sortOrder })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warehouses</h1>
          <p className="text-muted-foreground mt-1">{result.total} total warehouses</p>
        </div>
        <Link href="/admin/dashboard/warehouses/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Warehouse</Button>
        </Link>
      </div>

      <form className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="search" placeholder="Search warehouses..." defaultValue={search} className="pl-9" />
        </div>
        <button type="submit" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Search</button>
      </form>

      <WarehouseTable items={result.items} />

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/dashboard/warehouses?page=${p}&search=${search}`}
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
