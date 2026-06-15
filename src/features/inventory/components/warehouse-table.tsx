import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Plus, MapPin } from "lucide-react"

type Warehouse = {
  id: string
  name: string
  location: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function WarehouseTable({ items }: { items: Warehouse[] }) {
  if (items.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
        <p className="mb-3">No warehouses found</p>
        <Link
          href="/admin/dashboard/warehouses/new"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Create Warehouse
        </Link>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <div className="col-span-3">Name</div>
            <div className="col-span-4">Location</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          <div className="divide-y">
            {items.map((w) => (
              <Link
                key={w.id}
                href={`/admin/dashboard/warehouses/${w.id}`}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-muted/30 items-center"
              >
                <div className="col-span-3 font-medium">{w.name}</div>
                <div className="col-span-4 text-muted-foreground truncate">{w.location ?? "—"}</div>
                <div className="col-span-2 text-center">
                  <Badge variant={w.isActive ? "default" : "secondary"}>
                    {w.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="col-span-2 text-muted-foreground text-xs">
                  {new Date(w.createdAt).toLocaleDateString()}
                </div>
                <div className="col-span-1 text-right">
                  <ChevronRight className="h-4 w-4 inline text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
