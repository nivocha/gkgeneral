import { describe, it, expect } from "vitest"

// Core utility tests for pricing logic
function formatPrice(price: number, currency = "TZS"): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function calculateOrderTotal(items: { price: number; quantity: number }[], taxRate = 0, shipping = 0): {
  subtotal: number
  tax: number
  shipping: number
  total: number
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * taxRate
  const total = subtotal + tax + shipping
  return { subtotal, tax, shipping, total }
}

function isLowStock(quantity: number, reservedQuantity: number, minStockLevel: number): boolean {
  const available = quantity - reservedQuantity
  return available <= minStockLevel
}

function isOutOfStock(quantity: number, reservedQuantity: number): boolean {
  return quantity - reservedQuantity <= 0
}

function validateOrderStatusTransition(from: string, to: string): boolean {
  const transitions: Record<string, string[]> = {
    Pending: ["Processing", "Cancelled"],
    Processing: ["Paid", "Shipped", "Cancelled"],
    Paid: ["Processing", "Shipped", "Refunded"],
    Shipped: ["Delivered", "Cancelled"],
    Delivered: ["Refunded"],
    Cancelled: [],
    Refunded: [],
  }
  return transitions[from]?.includes(to) ?? false
}

function validatePaymentStatusTransition(from: string, to: string): boolean {
  const transitions: Record<string, string[]> = {
    Pending: ["Processing", "Failed", "Cancelled"],
    Processing: ["Paid", "Failed", "Cancelled"],
    Paid: ["Refunded"],
    Failed: ["Processing"],
    Refunded: [],
    Cancelled: [],
  }
  return transitions[from]?.includes(to) ?? false
}

describe("formatPrice", () => {
  it("formats TZS price correctly", () => {
    expect(formatPrice(150000)).toContain("150,000")
  })

  it("formats zero price", () => {
    expect(formatPrice(0)).toContain("0")
  })

  it("formats decimal price", () => {
    const result = formatPrice(1500.5)
    expect(result).toContain("1,50")
  })
})

describe("calculateOrderTotal", () => {
  it("calculates subtotal correctly", () => {
    const result = calculateOrderTotal([{ price: 100, quantity: 2 }])
    expect(result.subtotal).toBe(200)
    expect(result.total).toBe(200)
  })

  it("applies tax rate", () => {
    const result = calculateOrderTotal([{ price: 1000, quantity: 1 }], 0.18)
    expect(result.subtotal).toBe(1000)
    expect(result.tax).toBe(180)
    expect(result.total).toBe(1180)
  })

  it("adds shipping", () => {
    const result = calculateOrderTotal([{ price: 500, quantity: 2 }], 0, 50)
    expect(result.subtotal).toBe(1000)
    expect(result.shipping).toBe(50)
    expect(result.total).toBe(1050)
  })

  it("handles empty items", () => {
    const result = calculateOrderTotal([])
    expect(result.subtotal).toBe(0)
    expect(result.total).toBe(0)
  })

  it("handles multiple items", () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 3 },
      { price: 200, quantity: 1 },
    ]
    const result = calculateOrderTotal(items, 0.1, 25)
    expect(result.subtotal).toBe(550)
    expect(result.tax).toBe(55)
    expect(result.shipping).toBe(25)
    expect(result.total).toBe(630)
  })
})

describe("isLowStock", () => {
  it("returns true when available stock is at or below min level", () => {
    expect(isLowStock(10, 5, 5)).toBe(true)
    expect(isLowStock(10, 6, 5)).toBe(true)
    expect(isLowStock(5, 0, 5)).toBe(true)
  })

  it("returns false when available stock is above min level", () => {
    expect(isLowStock(10, 4, 5)).toBe(false)
    expect(isLowStock(20, 10, 5)).toBe(false)
  })

  it("handles edge case with no stock", () => {
    expect(isLowStock(0, 0, 5)).toBe(true)
  })
})

describe("isOutOfStock", () => {
  it("returns true when stock is depleted", () => {
    expect(isOutOfStock(0, 0)).toBe(true)
    expect(isOutOfStock(5, 5)).toBe(true)
    expect(isOutOfStock(3, 4)).toBe(true)
  })

  it("returns false when stock is available", () => {
    expect(isOutOfStock(10, 0)).toBe(false)
    expect(isOutOfStock(5, 2)).toBe(false)
  })
})

describe("validateOrderStatusTransition", () => {
  it("allows valid transitions", () => {
    expect(validateOrderStatusTransition("Pending", "Processing")).toBe(true)
    expect(validateOrderStatusTransition("Processing", "Paid")).toBe(true)
    expect(validateOrderStatusTransition("Paid", "Shipped")).toBe(true)
    expect(validateOrderStatusTransition("Pending", "Cancelled")).toBe(true)
  })

  it("rejects invalid transitions", () => {
    expect(validateOrderStatusTransition("Delivered", "Processing")).toBe(false)
    expect(validateOrderStatusTransition("Cancelled", "Paid")).toBe(false)
    expect(validateOrderStatusTransition("Pending", "Delivered")).toBe(false)
  })

  it("cancelled and refunded are terminal states", () => {
    expect(validateOrderStatusTransition("Cancelled", "Processing")).toBe(false)
    expect(validateOrderStatusTransition("Refunded", "Paid")).toBe(false)
  })
})

describe("validatePaymentStatusTransition", () => {
  it("allows valid transitions", () => {
    expect(validatePaymentStatusTransition("Pending", "Processing")).toBe(true)
    expect(validatePaymentStatusTransition("Processing", "Paid")).toBe(true)
    expect(validatePaymentStatusTransition("Paid", "Refunded")).toBe(true)
  })

  it("rejects invalid transitions", () => {
    expect(validatePaymentStatusTransition("Pending", "Refunded")).toBe(false)
    expect(validatePaymentStatusTransition("Paid", "Cancelled")).toBe(false)
    expect(validatePaymentStatusTransition("Cancelled", "Processing")).toBe(false)
  })
})
