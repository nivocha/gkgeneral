import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils"

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Refunded: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

type StatusHistoryItem = {
  id: string
  status: string
  note: string | null
  changedBy: string | null
  createdAt: Date
}

export function OrderStatusTimeline({ history }: { history: StatusHistoryItem[] }) {
  return (
    <div className="space-y-4">
      {history.map((h, idx) => (
        <div key={h.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${statusColors[h.status]?.split(" ")[0] ?? "bg-muted"}`} />
            {idx < history.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
          </div>
          <div className={idx < history.length - 1 ? "pb-4" : ""}>
            <div className="font-medium">
              <Badge className={statusColors[h.status] ?? ""}>{h.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{formatDateTime(h.createdAt)}</p>
            {h.note && <p className="text-sm text-muted-foreground mt-1">{h.note}</p>}
            {h.changedBy && <p className="text-xs text-muted-foreground mt-0.5">by {h.changedBy}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
