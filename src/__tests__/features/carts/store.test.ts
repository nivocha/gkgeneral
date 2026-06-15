import { describe, it, expect, beforeEach } from "vitest"
import { useCartStore } from "@/features/carts/store"

describe("Cart Store", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], itemCount: 0 })
  })

  const sampleItem = {
    id: "1",
    productId: "prod-1",
    name: "Test Product",
    price: "50000",
    quantity: 1,
    slug: "test-product",
    sku: "TST-001",
  }

  it("adds item to cart", () => {
    useCartStore.getState().addItem(sampleItem)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().itemCount).toBe(1)
  })

  it("increments quantity for duplicate item", () => {
    useCartStore.getState().addItem(sampleItem)
    useCartStore.getState().addItem(sampleItem)
    const item = useCartStore.getState().items[0]
    expect(item.quantity).toBe(2)
  })

  it("removes item from cart", () => {
    useCartStore.getState().addItem(sampleItem)
    useCartStore.getState().removeItem("prod-1")
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
