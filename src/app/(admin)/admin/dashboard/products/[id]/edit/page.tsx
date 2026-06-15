import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/session"
import { ProductForm } from "@/features/products/components/product-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Edit Product | Admin",
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params

  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      variants: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      downloads: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!product) notFound()

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

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    categoryId: product.categoryId,
    brandId: product.brandId,
    brand: product.brand,
    sku: product.sku,
    barcode: product.barcode,
    unit: product.unit,
    weight: product.weight ? String(product.weight) : null,
    dimensions: product.dimensions,
    material: product.material,
    warranty: product.warranty,
    minOrderQuantity: product.minOrderQuantity,
    maxOrderQuantity: product.maxOrderQuantity,
    status: product.status,
    isFeatured: product.isFeatured,
    isPublished: product.isPublished,
    price: product.price ? Number(product.price) : null,
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    currency: product.currency,
    tags: product.tags,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: String(Number(v.price)),
      costPrice: v.costPrice ? String(Number(v.costPrice)) : "",
      attributes: v.attributes ? JSON.stringify(v.attributes) : "",
      isActive: v.isActive,
      sortOrder: v.sortOrder,
    })),
    specifications: product.specifications.map((s) => ({
      id: s.id,
      label: s.label,
      value: s.value,
      unit: s.unit || "",
      sortOrder: s.sortOrder,
    })),
    downloads: product.downloads.map((d) => ({
      id: d.id,
      name: d.name,
      url: d.url,
      fileSize: d.fileSize || "",
      type: d.type,
    })),
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Product</h1>
      <ProductForm initialData={initialData} categories={categories} brands={brands} />
    </div>
  )
}
