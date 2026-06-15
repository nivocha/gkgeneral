import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StockLevelBadge } from "@/features/inventory/components/inventory-status-badge"
import { AlertTriangle } from "lucide-react"

type LowStockItem = {
  productId: string
  productName: string
  productSku: string
  warehouseId: string
  warehouseName: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  minStockLevel: number
}

export function LowStockAlertCard({ items }: { items: LowStockItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-green-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">All stock levels are healthy</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Low Stock Alerts
          <span className="ml-auto text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 10).map((item) => (
          <div key={`${item.productId}-${item.warehouseId}`} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{item.productName}</p>
              <p className="text-xs text-muted-foreground">{item.warehouseName} · {item.productSku}</p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-muted-foreground">{item.availableQuantity}/{item.minStockLevel}</span>
              <StockLevelBadge available={item.availableQuantity} minStockLevel={item.minStockLevel} />
            </div>
          </div>
        ))}
        {items.length > 10 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{items.length - 10} more items
          </p>
        )}
      </CardContent>
    </Card>
  )
}
