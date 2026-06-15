import Link from "next/link"
import { StockLevelBadge } from "@/features/inventory/components/inventory-status-badge"
import { formatPrice } from "@/lib/utils"
import { ChevronRight, Warehouse } from "lucide-react"

type InventoryItem = {
  id: string
  quantity: number
  reservedQuantity: number
  minStockLevel: number
  product: { id: string; name: string; sku: string; price: number; unit: string; isPublished: boolean }
  warehouse: { id: string; name: string }
}

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center text-muted-foreground">
        <Warehouse className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
        <p>No inventory records found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <div className="col-span-3">Product</div>
            <div className="col-span-1">SKU</div>
            <div className="col-span-2">Warehouse</div>
            <div className="col-span-1 text-right">On Hand</div>
            <div className="col-span-1 text-right">Reserved</div>
            <div className="col-span-1 text-right">Available</div>
            <div className="col-span-1">Min Level</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          <div className="divide-y">
            {items.map((item) => {
              const available = item.quantity - item.reservedQuantity
              return (
                <Link
                  key={item.id}
                  href={`/admin/dashboard/inventory/${item.id}`}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-muted/30 items-center"
                >
                  <div className="col-span-3 font-medium truncate">{item.product.name}</div>
                  <div className="col-span-1 font-mono text-xs text-muted-foreground">{item.product.sku}</div>
                  <div className="col-span-2 truncate">{item.warehouse.name}</div>
                  <div className="col-span-1 text-right font-mono">{item.quantity}</div>
                  <div className="col-span-1 text-right font-mono text-muted-foreground">{item.reservedQuantity}</div>
                  <div className={`col-span-1 text-right font-mono font-medium ${available <= 0 ? "text-red-600" : available <= item.minStockLevel ? "text-amber-600" : "text-green-600"}`}>
                    {available}
                  </div>
                  <div className="col-span-1 text-center font-mono text-xs">{item.minStockLevel}</div>
                  <div className="col-span-1"><StockLevelBadge available={available} minStockLevel={item.minStockLevel} /></div>
                  <div className="col-span-1 text-right"><ChevronRight className="h-4 w-4 inline text-muted-foreground" /></div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
