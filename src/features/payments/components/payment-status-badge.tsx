import { PAYMENT_STATUS_COLORS } from "@/features/payments/lib/payment-status"
import type { PaymentStatus } from "@/lib/prisma"

export function PaymentStatusBadge({ status }: { status: string }) {
  const colorClass = PAYMENT_STATUS_COLORS[status as PaymentStatus]
    ?? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  )
}
