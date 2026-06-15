import { describe, it, expect } from "vitest"

describe("Payment State Machine", () => {
  it("allows Pending -> Processing", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Pending" as any, "Processing" as any)).toBe(true)
  })

  it("allows Pending -> Paid", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Pending" as any, "Paid" as any)).toBe(true)
  })

  it("allows Pending -> Failed", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Pending" as any, "Failed" as any)).toBe(true)
  })

  it("allows Pending -> Cancelled", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Pending" as any, "Cancelled" as any)).toBe(true)
  })

  it("allows Processing -> Paid", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Processing" as any, "Paid" as any)).toBe(true)
  })

  it("allows Processing -> Failed", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Processing" as any, "Failed" as any)).toBe(true)
  })

  it("allows Paid -> Refunded", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Paid" as any, "Refunded" as any)).toBe(true)
  })

  it("rejects Paid -> Processing", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Paid" as any, "Processing" as any)).toBe(false)
  })

  it("rejects Pending -> Refunded", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Pending" as any, "Refunded" as any)).toBe(false)
  })

  it("rejects Refunded -> Paid", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Refunded" as any, "Paid" as any)).toBe(false)
  })

  it("rejects Cancelled -> any", async () => {
    const { isValidPaymentTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(isValidPaymentTransition("Cancelled" as any, "Pending" as any)).toBe(false)
    expect(isValidPaymentTransition("Cancelled" as any, "Processing" as any)).toBe(false)
    expect(isValidPaymentTransition("Cancelled" as any, "Paid" as any)).toBe(false)
    expect(isValidPaymentTransition("Cancelled" as any, "Failed" as any)).toBe(false)
    expect(isValidPaymentTransition("Cancelled" as any, "Refunded" as any)).toBe(false)
  })

  it("assertValidTransition throws on invalid", async () => {
    const { assertValidTransition } = await import("@/features/payments/lib/payment-state-machine")
    expect(() => assertValidTransition("Paid" as any, "Pending" as any)).toThrow()
  })

  it("returns correct next order status", async () => {
    const { getNextOrderStatusOnPaid } = await import("@/features/payments/lib/payment-state-machine")
    expect(getNextOrderStatusOnPaid("Pending")).toBe("Processing")
    expect(getNextOrderStatusOnPaid("Processing")).toBe("Paid")
    expect(getNextOrderStatusOnPaid("Shipped")).toBe("Paid")
  })
})
