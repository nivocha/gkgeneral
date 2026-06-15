"use server"

import { prisma } from "@/lib/prisma"
import { getAuth } from "@/lib/auth/session"

export async function trackProductView(productId: string) {
  await prisma.product.update({
    where: { id: productId },
    data: { viewCount: { increment: 1 } },
  })

  const session = await getAuth()
  if (session?.user?.id) {
    await prisma.recentlyViewed.upsert({
      where: { userId_productId: { userId: session.user.id, productId } },
      update: { viewedAt: new Date() },
      create: { userId: session.user.id, productId },
    })
  }
}

export async function getRecentlyViewed(userId: string) {
  const items = await prisma.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: 10,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
        },
      },
    },
  })

  return items.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    price: Number(item.product.price),
    comparePrice: Number(item.product.comparePrice),
    image: item.product.images[0] ?? null,
    viewedAt: item.viewedAt,
  }))
}
