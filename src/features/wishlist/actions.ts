"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"

export async function addToWishlist(productId: string) {
  const user = await requireAuth()
  try {
    await prisma.wishlist.create({ data: { userId: user.id, productId } })
    revalidatePath("/account/wishlist")
    return { success: true, message: "Added to wishlist" }
  } catch {
    return { success: false, message: "Already in wishlist" }
  }
}

export async function removeFromWishlist(productId: string) {
  const user = await requireAuth()
  await prisma.wishlist.deleteMany({ where: { userId: user.id, productId } })
  revalidatePath("/account/wishlist")
  return { success: true }
}

export async function getWishlist() {
  try {
    const user = await requireAuth()
    const items = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, sku: true, price: true, unit: true, currency: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return items.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      product: {
        ...item.product,
        price: item.product.price ? Number(item.product.price) : null,
        primaryImage: item.product.images[0] || null,
      },
    }))
  } catch {
    return []
  }
}
