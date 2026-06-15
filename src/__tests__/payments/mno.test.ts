import { describe, it, expect, beforeAll } from "vitest"

describe("MNO Payment", () => {
  beforeAll(() => {
    process.env.EVMAK_MNO_USERNAME = "testmerchant"
  })

  it("generates MD5 hash correctly", async () => {
    const { generateMnoHash } = await import("@/features/payments/lib/mno")
    const hash = generateMnoHash("2026-01-15")
    expect(hash).toBeDefined()
    expect(typeof hash).toBe("string")
    expect(hash.length).toBe(32) // MD5 hex is 32 chars
  })

  it("generates different hash for different dates", async () => {
    const { generateMnoHash } = await import("@/features/payments/lib/mno")
    const hash1 = generateMnoHash("2026-01-15")
    const hash2 = generateMnoHash("2026-01-16")
    expect(hash1).not.toBe(hash2)
  })

  it("returns correct provider codes", async () => {
    const { getMnoProviderCode } = await import("@/features/payments/lib/mno")
    expect(getMnoProviderCode("mpesa")).toBe("MPESA")
    expect(getMnoProviderCode("tigo_pesa")).toBe("TIGO")
    expect(getMnoProviderCode("airtel_money")).toBe("AIRTEL")
    expect(getMnoProviderCode("halopesa")).toBe("HALOPESA")
  })

  it("generates unique references", async () => {
    const { generateMnoReference } = await import("@/features/payments/lib/mno")
    const ref1 = generateMnoReference()
    const ref2 = generateMnoReference()
    expect(ref1).not.toBe(ref2)
    expect(ref1).toMatch(/^MNO-/)
    expect(ref2).toMatch(/^MNO-/)
  })

  it("throws when username is not configured", async () => {
    const originalUsername = process.env.EVMAK_MNO_USERNAME
    delete process.env.EVMAK_MNO_USERNAME

    const { createMnoPayment } = await import("@/features/payments/lib/mno")
    await expect(
      createMnoPayment({
        provider: "mpesa",
        amount: 50000,
        phoneNumber: "255712345678",
        reference: "MNO-TEST",
        callbackUrl: "http://localhost/api/payments/callback",
      })
    ).rejects.toThrow("EVMAK_MNO_USERNAME")

    process.env.EVMAK_MNO_USERNAME = originalUsername
  })
})
