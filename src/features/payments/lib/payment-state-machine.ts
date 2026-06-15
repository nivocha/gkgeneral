import type { PaymentStatus } from "@/lib/prisma"

const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  Pending: ["Processing", "Paid", "Failed", "Cancelled"],
  Processing: ["Paid", "Failed"],
  Paid: ["Refunded"],
  Failed: [],
  Refunded: [],
  Cancelled: [],
}

export function isValidPaymentTransition(
  current: PaymentStatus,
  next: PaymentStatus
): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false
}

export function assertValidTransition(
  current: PaymentStatus,
  next: PaymentStatus
): void {
  if (!isValidPaymentTransition(current, next)) {
    throw new Error(
      `Invalid payment status transition: ${current} -> ${next}`
    )
  }
}

export function getNextOrderStatusOnPaid(currentOrderStatus: string): string {
  return currentOrderStatus === "Pending" ? "Processing" : "Paid"
}
