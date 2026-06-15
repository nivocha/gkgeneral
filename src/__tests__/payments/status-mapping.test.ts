import { describe, it, expect } from "vitest"

describe("Payment Status Mapping", () => {
  it("maps completed to Paid", async () => {
    const { mapEvMakStatusToPaymentStatus } = await import("@/features/payments/lib/payment-status")
    expect(mapEvMakStatusToPaymentStatus("completed")).toBe("Paid")
  })

  it("maps failed to Failed", async () => {
    const { mapEvMakStatusToPaymentStatus } = await import("@/features/payments/lib/payment-status")
    expect(mapEvMakStatusToPaymentStatus("failed")).toBe("Failed")
  })

  it("maps refunded to Refunded", async () => {
    const { mapEvMakStatusToPaymentStatus } = await import("@/features/payments/lib/payment-status")
    expect(mapEvMakStatusToPaymentStatus("refunded")).toBe("Refunded")
  })

  it("maps cancelled to Cancelled", async () => {
    const { mapEvMakStatusToPaymentStatus } = await import("@/features/payments/lib/payment-status")
    expect(mapEvMakStatusToPaymentStatus("cancelled")).toBe("Cancelled")
  })

  it("maps AUTHORIZED to Processing", async () => {
    const { mapEvMakStatusToPaymentStatus } = await import("@/features/payments/lib/payment-status")
    expect(mapEvMakStatusToPaymentStatus("AUTHORIZED")).toBe("Processing")
  })

  it("maps DECLINED to Failed", async () => {
    const { mapEvMakStatusToPaymentStatus } = await import("@/features/payments/lib/payment-status")
    expect(mapEvMakStatusToPaymentStatus("DECLINED")).toBe("Failed")
  })

  it("maps CANCELLED (double L) to Cancelled", async () => {
    const { mapEvMakStatusToPaymentStatus } = await import("@/features/payments/lib/payment-status")
    expect(mapEvMakStatusToPaymentStatus("CANCELLED")).toBe("Cancelled")
  })

  it("returns null for unknown status", async () => {
    const { mapEvMakStatusToPaymentStatus } = await import("@/features/payments/lib/payment-status")
    expect(mapEvMakStatusToPaymentStatus("unknown_status")).toBeNull()
  })

  it("identifies terminal statuses", async () => {
    const { isTerminalStatus } = await import("@/features/payments/lib/payment-status")
    expect(isTerminalStatus("Paid" as any)).toBe(true)
    expect(isTerminalStatus("Failed" as any)).toBe(true)
    expect(isTerminalStatus("Refunded" as any)).toBe(true)
    expect(isTerminalStatus("Cancelled" as any)).toBe(true)
    expect(isTerminalStatus("Pending" as any)).toBe(false)
    expect(isTerminalStatus("Processing" as any)).toBe(false)
  })
})
