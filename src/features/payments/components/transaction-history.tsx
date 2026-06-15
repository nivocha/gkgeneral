import { formatDateTime, formatPrice } from "@/lib/utils"

export type Transaction = {
  id: string
  status: string
  amount: number
  reference: string | null
  metadata: string | null
  createdAt: Date
}

const statusIcons: Record<string, string> = {
  Processing: "bg-blue-100 dark:bg-blue-900",
  Paid: "bg-green-100 dark:bg-green-900",
  Failed: "bg-red-100 dark:bg-red-900",
  Refunded: "bg-orange-100 dark:bg-orange-900",
  Cancelled: "bg-gray-100 dark:bg-gray-900",
}

export function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No transactions recorded
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx, index) => {
        const isLast = index === transactions.length - 1
        const iconBg = statusIcons[tx.status] ?? "bg-muted"
        return (
          <div key={tx.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${iconBg} border-2 border-background`} />
              {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className={`pb-4 ${isLast ? "" : ""}`}>
              <p className="font-medium text-sm capitalize">{tx.status.toLowerCase()}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                {tx.reference && <span className="font-mono">{tx.reference}</span>}
                <span>{formatPrice(tx.amount)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
