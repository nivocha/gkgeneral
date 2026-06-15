import { Card, CardContent } from "@/components/ui/card"
import { Package, AlertTriangle, XCircle, Building2, DollarSign } from "lucide-react"

type Analytics = {
  totalStockValue: number
  totalSkus: number
  lowStock: number
  outOfStock: number
  activeWarehouses: number
}

export function InventoryAnalyticsCards({ data }: { data: Analytics }) {
  const cards = [
    {
      title: "Total Stock Value",
      value: `TSh ${(data.totalStockValue).toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Total SKUs",
      value: data.totalSkus.toString(),
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Low Stock Items",
      value: data.lowStock.toString(),
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "Out of Stock",
      value: data.outOfStock.toString(),
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Active Warehouses",
      value: data.activeWarehouses.toString(),
      icon: Building2,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="text-lg font-bold">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
