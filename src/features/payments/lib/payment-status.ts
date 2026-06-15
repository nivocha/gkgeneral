import type { PaymentStatus } from "@/lib/prisma"

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  Pending: "Pending",
  Processing: "Processing",
  Paid: "Paid",
  Failed: "Failed",
  Refunded: "Refunded",
  Cancelled: "Cancelled",
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Refunded: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

export function mapEvMakStatusToPaymentStatus(
  evmakStatus: string
): PaymentStatus | null {
  const map: Record<string, PaymentStatus> = {
    completed: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    cancelled: "Cancelled",
    pending: "Pending",
    processing: "Processing",
    AUTHORIZED: "Paid",
    DECLINED: "Failed",
    CANCELLED: "Cancelled",
    AUTHORIZED_RISK_DECLINED: "Failed",
  }
  return map[evmakStatus] ?? null
}

export function isTerminalStatus(status: PaymentStatus): boolean {
  return status === "Paid" || status === "Failed" || status === "Refunded" || status === "Cancelled"
}
