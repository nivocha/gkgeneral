import { create } from "zustand"
import { persist } from "zustand/middleware"

type CartItem = {
  id: string
  productId: string
  name: string
  price: string
  quantity: number
  image?: string
  slug?: string
  sku?: string
}

type CartStore = {
  items: CartItem[]
  itemCount: number
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId)
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
            itemCount: state.itemCount + 1,
          }))
        } else {
          set((state) => ({
            items: [...state.items, { ...item, quantity: 1 }],
            itemCount: state.itemCount + 1,
          }))
        }
      },
      removeItem: (productId) => {
        const item = get().items.find((i) => i.productId === productId)
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
          itemCount: state.itemCount - (item?.quantity || 0),
        }))
      },
      updateQuantity: (productId, quantity) => {
        const oldItem = get().items.find((i) => i.productId === productId)
        const diff = quantity - (oldItem?.quantity || 0)
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
          itemCount: state.itemCount + diff,
        }))
      },
      clearCart: () => set({ items: [], itemCount: 0 }),
    }),
    { name: "gk-cart" }
  )
)
