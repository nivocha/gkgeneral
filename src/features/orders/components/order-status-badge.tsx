import { Badge } from "@/components/ui/badge"

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Refunded: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge className={statusColors[status] ?? ""}>{status}</Badge>
}
