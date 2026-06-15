import { describe, it, expect } from "vitest"

describe("Order Status Transitions", () => {
  const validTransitions: Record<string, string[]> = {
    Pending: ["Processing", "Cancelled"],
    Processing: ["Paid", "Shipped", "Cancelled"],
    Paid: ["Processing", "Shipped"],
    Shipped: ["Delivered"],
    Delivered: [],
    Cancelled: [],
    Refunded: [],
  }

  function isValidTransition(from: string, to: string): boolean {
    return validTransitions[from]?.includes(to) ?? false
  }

  it("allows Pending → Processing", () => {
    expect(isValidTransition("Pending", "Processing")).toBe(true)
  })
  it("allows Pending → Cancelled", () => {
    expect(isValidTransition("Pending", "Cancelled")).toBe(true)
  })
  it("allows Processing → Paid", () => {
    expect(isValidTransition("Processing", "Paid")).toBe(true)
  })
  it("rejects Pending → Delivered", () => {
    expect(isValidTransition("Pending", "Delivered")).toBe(false)
  })
  it("rejects Delivered → Processing", () => {
    expect(isValidTransition("Delivered", "Processing")).toBe(false)
  })
})
