import Link from "next/link"
import { PaymentStatusBadge } from "@/features/payments/components/payment-status-badge"
import { formatPrice, formatDate } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

export type PaymentTableRow = {
  id: string
  status: string
  amount: number
  currency: string
  method: string
  reference: string | null
  paidAt: Date | null
  createdAt: Date
  orderId: string
  orderNumber: string
  customer?: { id: string; name: string; email: string }
}

export function PaymentTable({
  items,
  isAdmin,
}: {
  items: PaymentTableRow[]
  isAdmin?: boolean
}) {
  return (
    <div className="border rounded-lg">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <div className="col-span-2">Reference</div>
            <div className="col-span-2">Order</div>
            {isAdmin && <div className="col-span-2">Customer</div>}
            <div className={`col-span-1 text-right${isAdmin ? "" : " col-start-5"}`}>Amount</div>
            <div className="col-span-1">Method</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          <div className="divide-y">
            {items.map((p) => (
              <Link
                key={p.id}
                href={isAdmin ? `/admin/dashboard/payments/${p.id}` : `/account/payments/${p.id}`}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-muted/30 items-center"
              >
                <div className="col-span-2 font-mono font-medium truncate">
                  {p.reference ?? "—"}
                </div>
                <div className="col-span-2 font-mono text-xs">{p.orderNumber}</div>
                {isAdmin && (
                  <div className="col-span-2 truncate">{p.customer?.name ?? "—"}</div>
                )}
                <div className={`col-span-1 text-right font-medium${isAdmin ? "" : " col-start-5"}`}>
                  {formatPrice(p.amount)}
                </div>
                <div className="col-span-1 capitalize text-xs">{p.method.replace(/_/g, " ")}</div>
                <div className="col-span-1"><PaymentStatusBadge status={p.status} /></div>
                <div className="col-span-1 text-muted-foreground text-xs">{formatDate(p.createdAt)}</div>
                <div className="col-span-1 text-right">
                  <ChevronRight className="h-4 w-4 inline text-muted-foreground" />
                </div>
              </Link>
            ))}
            {items.length === 0 && (
              <div className="px-4 py-12 text-center text-muted-foreground">
                No payments found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
