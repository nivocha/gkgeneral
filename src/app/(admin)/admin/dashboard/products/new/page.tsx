import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/session"
import { ProductForm } from "@/features/products/components/product-form"

export const metadata = {
  title: "New Product | Admin",
}

export const dynamic = "force-dynamic"

export default async function NewProductPage() {
  await requireAuth()

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, logo: true },
    }),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">New Product</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  )
}
