import { describe, it, expect, beforeAll } from "vitest"

describe("Signature Utility", () => {
  beforeAll(() => {
    process.env.EVMAK_CLIENT_ID = "test-client-id"
    process.env.EVMAK_CLIENT_SECRET = "test-client-secret"
  })

  it("creates HMAC signature with correct format", async () => {
    const { createOutboundSignature, generateTimestamp } = await import("@/features/payments/lib/signature")
    const timestamp = generateTimestamp()
    const { signature, clientId } = createOutboundSignature(timestamp)

    expect(clientId).toBe("test-client-id")
    expect(signature).toBeDefined()
    expect(typeof signature).toBe("string")
    expect(signature.length).toBeGreaterThan(0)
  })

  it("verifies a valid signature using timingSafeEqual", async () => {
    const { createOutboundSignature, verifyInboundSignature, generateTimestamp } = await import("@/features/payments/lib/signature")
    const timestamp = generateTimestamp()
    const { signature, clientId } = createOutboundSignature(timestamp)

    const isValid = verifyInboundSignature(
      signature,
      clientId,
      timestamp,
      "test-client-secret"
    )

    expect(isValid).toBe(true)
  })

  it("rejects an invalid signature", async () => {
    const { verifyInboundSignature, generateTimestamp } = await import("@/features/payments/lib/signature")
    const timestamp = generateTimestamp()

    const isValid = verifyInboundSignature(
      "invalid-signature",
      "test-client-id",
      timestamp,
      "test-client-secret"
    )

    expect(isValid).toBe(false)
  })

  it("rejects signature with wrong secret", async () => {
    const { createOutboundSignature, verifyInboundSignature, generateTimestamp } = await import("@/features/payments/lib/signature")
    const timestamp = generateTimestamp()
    const { signature, clientId } = createOutboundSignature(timestamp)

    const isValid = verifyInboundSignature(
      signature,
      clientId,
      timestamp,
      "wrong-secret"
    )

    expect(isValid).toBe(false)
  })

  it("validates timestamp within acceptable range", async () => {
    const { validateTimestamp, generateTimestamp } = await import("@/features/payments/lib/signature")
    const timestamp = generateTimestamp()
    expect(validateTimestamp(timestamp)).toBe(true)
  })

  it("rejects expired timestamp", async () => {
    const { validateTimestamp } = await import("@/features/payments/lib/signature")
    const oldTimestamp = (Date.now() - 10 * 60 * 1000).toString()
    expect(validateTimestamp(oldTimestamp)).toBe(false)
  })

  it("rejects invalid timestamp string", async () => {
    const { validateTimestamp } = await import("@/features/payments/lib/signature")
    expect(validateTimestamp("not-a-number")).toBe(false)
  })

  it("base64 encodes and decodes payload", async () => {
    const { base64Encode, base64Decode } = await import("@/features/payments/lib/signature")

    const payload = { orderId: "123", amount: 50000, currency: "TZS" }
    const encoded = base64Encode(payload)
    const decoded = base64Decode<typeof payload>(encoded)

    expect(decoded).toEqual(payload)
    expect(typeof encoded).toBe("string")
    expect(encoded).not.toContain("{")
  })

  it("generates unique nonces", async () => {
    const { generateNonce } = await import("@/features/payments/lib/signature")
    const nonce1 = generateNonce()
    const nonce2 = generateNonce()
    expect(nonce1).not.toBe(nonce2)
  })
})
