import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { ProductsListClient, ProductsListSkeleton } from "./products-list-client"
import { requireAuth } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Products | Admin",
}

async function ProductsContent({ searchParams: sp }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  await requireAuth()

  const params = await sp
  const search = params.search || ""
  const status = params.status || "all"
  const category = params.category || ""
  const sort = (params.sort || "newest") as any
  const page = parseInt(params.page || "1")

  const where: any = { deletedAt: null }
  if (status && status !== "all") where.status = status
  if (category) where.categoryId = category
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { sku: { contains: search, mode: "insensitive" as const } },
      { brand: { contains: search, mode: "insensitive" as const } },
    ]
  }

  const orderBy: any =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : sort === "name_asc"
        ? { name: "asc" as const }
        : sort === "name_desc"
          ? { name: "desc" as const }
          : sort === "price_asc"
            ? { price: "asc" as const }
            : sort === "price_desc"
              ? { price: "desc" as const }
              : { createdAt: "desc" as const }

  const pageSize = 20

  const [items, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
        inventories: { select: { quantity: true, reservedQuantity: true, minStockLevel: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ])

  const products = items.map((p) => {
    const totalStock = p.inventories.reduce((sum, i) => sum + i.quantity, 0)
    const minLevel = p.inventories.length > 0
      ? Math.min(...p.inventories.map((i) => i.minStockLevel))
      : 5
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      brand: p.brand?.name || null,
      status: p.status as "Draft" | "Active" | "Archived" | "OutOfStock",
      isFeatured: p.isFeatured,
      price: p.price ? Number(p.price) : null,
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      stockQuantity: totalStock,
      minStockLevel: minLevel,
      currency: p.currency,
      createdAt: p.createdAt,
      category: p.category,
      primaryImage: p.images[0] || null,
      variantCount: 0,
      imageCount: 0,
    }
  })

  return (
    <ProductsListClient
      products={products}
      total={total}
      page={page}
      totalPages={Math.ceil(total / pageSize)}
      categories={categories}
    />
  )
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  return (
    <Suspense fallback={<ProductsListSkeleton />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  )
}
