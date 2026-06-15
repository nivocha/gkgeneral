import { Badge } from "@/components/ui/badge"

const statusColors: Record<string, string> = {
  STOCK_IN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  STOCK_OUT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ADJUSTMENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  TRANSFER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  RESERVED: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  RELEASED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

export function InventoryStatusBadge({ type }: { type: string }) {
  const colorClass = statusColors[type] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  return <Badge className={colorClass}>{type.replace(/_/g, " ")}</Badge>
}

export function StockLevelBadge({ available, minStockLevel }: { available: number; minStockLevel: number }) {
  if (available <= 0) {
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Out of Stock</Badge>
  }
  if (available <= minStockLevel) {
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Low Stock</Badge>
  }
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">In Stock</Badge>
}
