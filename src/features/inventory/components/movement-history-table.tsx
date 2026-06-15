import { InventoryStatusBadge } from "@/features/inventory/components/inventory-status-badge"
import { formatDateTime } from "@/lib/utils"

type Movement = {
  id: string
  type: string
  quantity: number
  reference: string | null
  note: string | null
  createdAt: Date
  product: { id: string; name: string; sku: string }
  warehouse: { id: string; name: string }
}

export function MovementHistoryTable({ items }: { items: Movement[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No movements recorded
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <div className="col-span-3">Product</div>
            <div className="col-span-2">Warehouse</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2">Reference</div>
            <div className="col-span-2">Date</div>
          </div>
          <div className="divide-y">
            {items.map((m) => (
              <div key={m.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center">
                <div className="col-span-3 font-medium truncate">{m.product.name}</div>
                <div className="col-span-2 text-muted-foreground truncate">{m.warehouse.name}</div>
                <div className="col-span-2"><InventoryStatusBadge type={m.type} /></div>
                <div className="col-span-1 text-right font-mono">{m.quantity}</div>
                <div className="col-span-2 font-mono text-xs text-muted-foreground truncate">{m.reference ?? "—"}</div>
                <div className="col-span-2 text-muted-foreground text-xs">{formatDateTime(m.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
