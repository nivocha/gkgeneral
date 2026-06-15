import { describe, it, expect } from "vitest"

describe("Payment Error Handling", () => {
  it("PaymentError has correct properties", async () => {
    const { PaymentError } = await import("@/features/payments/lib/errors")
    const error = new PaymentError("Test error", "TEST_ERR", 400, { field: "amount" })
    expect(error.message).toBe("Test error")
    expect(error.code).toBe("TEST_ERR")
    expect(error.statusCode).toBe(400)
    expect(error.details).toEqual({ field: "amount" })
    expect(error.name).toBe("PaymentError")
  })

  it("ProviderError masks internal details", async () => {
    const { ProviderError, getSafeErrorMessage } = await import("@/features/payments/lib/errors")
    const error = new ProviderError("connection refused", 502, "Internal server error")
    expect(getSafeErrorMessage(error)).toBe("Payment provider error. Please try again later.")
  })

  it("PaymentError shows safe message", async () => {
    const { PaymentError, getSafeErrorMessage } = await import("@/features/payments/lib/errors")
    const error = new PaymentError("Insufficient funds", "INSUFFICIENT_FUNDS")
    expect(getSafeErrorMessage(error)).toBe("Insufficient funds")
  })

  it("unknown errors return generic message", async () => {
    const { getSafeErrorMessage } = await import("@/features/payments/lib/errors")
    expect(getSafeErrorMessage(new Error("something broke"))).toBe("An unexpected error occurred. Please try again.")
  })

  it("maps provider status codes to messages", async () => {
    const { mapProviderError } = await import("@/features/payments/lib/errors")
    expect(mapProviderError(500)).toContain("not responding")
    expect(mapProviderError(401)).toContain("authentication failed")
    expect(mapProviderError(403)).toContain("authentication failed")
    expect(mapProviderError(404)).toContain("not found")
    expect(mapProviderError(429)).toContain("Too many requests")
    expect(mapProviderError(400)).toContain("failed")
  })
})
