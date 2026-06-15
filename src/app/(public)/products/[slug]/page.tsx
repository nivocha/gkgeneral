import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductDetailContent } from "./content"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, status: "Active", isPublished: true },
    select: { name: true, shortDescription: true, description: true, images: { where: { isPrimary: true }, take: 1 } },
  })
  if (!product) return { title: "Product Not Found" }
  return {
    title: product.name,
    description: product.shortDescription || product.description?.slice(0, 160) || undefined,
    openGraph: {
      title: product.name,
      description: product.shortDescription || undefined,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, status: "Active", isPublished: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logo: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      downloads: { orderBy: { createdAt: "desc" } },
      inventories: { select: { quantity: true } },
    },
  })

  if (!product) notFound()

  const stockQuantity = product.inventories.reduce((s, i) => s + i.quantity, 0)

  const productData = {
    ...product,
    price: product.price ? Number(product.price) : null,
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    weight: product.weight ? String(product.weight) : null,
    stockQuantity,
    variants: product.variants.map((v: any) => ({
      ...v,
      price: Number(v.price),
      costPrice: v.costPrice ? Number(v.costPrice) : null,
    })),
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      price: product.price ? Number(product.price) : undefined,
      priceCurrency: product.currency,
      availability: stockQuantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    image: product.images[0]?.url,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailContent product={productData} />
    </>
  )
}
