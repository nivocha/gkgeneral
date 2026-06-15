"use server"

import { prisma } from "@/lib/prisma"

export async function getPublicBrands() {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  })
}

export async function getPublicBrandBySlug(slug: string) {
  const brand = await prisma.brand.findUnique({
    where: { slug, isActive: true },
    include: { _count: { select: { products: true } } },
  })
  if (!brand) return null

  const products = await prisma.product.findMany({
    where: { brandId: brand.id, status: "Active", isPublished: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      comparePrice: true,
      unit: true,
      description: true,
      shortDescription: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return {
    ...brand,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: Number(p.price),
      comparePrice: Number(p.comparePrice),
      unit: p.unit,
      description: p.shortDescription || p.description,
      image: p.images[0] ?? null,
      category: p.category,
    })),
  }
}
