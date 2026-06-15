"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

type GuestCartItem = {
  productId: string
  name: string
  price: string
  quantity: number
  image?: string
  slug?: string
}

export async function syncCartAction(items: GuestCartItem[]) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, message: "Not authenticated" }

    if (!items.length) return { success: true, message: "Cart synced", data: { added: 0, updated: 0, skipped: 0 } }

    const userId = session.user.id

    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
      })

      let added = 0
      let updated = 0
      let skipped = 0

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true },
        })
        if (!product) {
          skipped++
          continue
        }

        const stockAgg = await tx.inventory.aggregate({
          where: { productId: item.productId },
          _sum: { quantity: true },
        })
        const availableStock = stockAgg._sum.quantity ?? 0

        const existing = await tx.cartItem.findFirst({
          where: { cartId: cart.id, productId: item.productId },
        })

        if (existing) {
          const mergedQty = Math.min(existing.quantity + item.quantity, availableStock)
          if (mergedQty > 0) {
            await tx.cartItem.update({
              where: { id: existing.id },
              data: { quantity: mergedQty },
            })
          }
          updated++
        } else {
          const qty = Math.min(item.quantity, availableStock)
          if (qty > 0) {
            await tx.cartItem.create({
              data: {
                cartId: cart.id,
                productId: item.productId,
                quantity: qty,
              },
            })
            added++
          } else {
            skipped++
          }
        }
      }

      return { added, updated, skipped }
    })

    return { success: true, message: "Cart synced", data: result }
  } catch (error) {
    console.error("Cart sync error:", error)
    return { success: false, message: "Failed to sync cart" }
  }
}

export async function getMergedCartCount() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { count: 0 }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      select: {
        items: {
          select: { quantity: true },
        },
      },
    })

    if (!cart) return { count: 0 }

    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    return { count }
  } catch {
    return { count: 0 }
  }
}
