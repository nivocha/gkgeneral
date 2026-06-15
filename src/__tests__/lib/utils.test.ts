import { describe, it, expect } from "vitest"
import { formatPrice, cn, getBaseUrl } from "@/lib/utils"

describe("formatPrice", () => {
  it("formats TZS correctly", () => {
    expect(formatPrice(15000)).toContain("15,000")
  })
  it("handles zero", () => {
    expect(formatPrice(0)).toContain("0")
  })
})

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })
})
