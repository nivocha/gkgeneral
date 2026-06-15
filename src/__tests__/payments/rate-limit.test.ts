import { describe, it, expect } from "vitest"

describe("Rate Limiter", () => {
  it("allows first request within limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit")
    const result = checkRateLimit("test-ip", 5, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("blocks request over limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit")
    const key = `over-limit-${Date.now()}`
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60000)
    }
    const result = checkRateLimit(key, 3, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("resets after window expires", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit")
    const key = `window-reset-${Date.now()}`
    checkRateLimit(key, 2, 1)
    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 2))
    const result = checkRateLimit(key, 2, 1)
    expect(result.allowed).toBe(true)
  }, 10000)

  it("extracts client IP from headers", async () => {
    const { getClientIp } = await import("@/lib/rate-limit")
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    })
    expect(getClientIp(request)).toBe("192.168.1.1")
  })

  it("falls back to unknown when no IP header", async () => {
    const { getClientIp } = await import("@/lib/rate-limit")
    const request = new Request("http://localhost")
    expect(getClientIp(request)).toBe("unknown")
  })
})
