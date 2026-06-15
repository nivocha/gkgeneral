import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, Package } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { getPublicBrandBySlug } from "@/features/brands/actions/get-brands"
import { ProductCard } from "@/features/products/components/product-card"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brand = await getPublicBrandBySlug(slug)
  if (!brand) return { title: "Brand Not Found" }
  return {
    title: `${brand.name} | Brands | GK General Supply`,
    description: brand.description || `Browse ${brand.name} products at GK General Supply.`,
    openGraph: {
      title: `${brand.name} - GK General Supply`,
      description: brand.description || undefined,
    },
  }
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params
  const brand = await getPublicBrandBySlug(slug)
  if (!brand) notFound()

  return (
    <div className="container py-12">
      <Link
        href="/brands"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> All Brands
      </Link>

      <div className="flex items-start gap-6 mb-10">
        {brand.logo ? (
          <img src={brand.logo} alt={brand.name} className="h-20 w-20 object-contain rounded-xl" />
        ) : null}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{brand.name}</h1>
          {brand.description && (
            <p className="text-muted-foreground mt-2 text-lg max-w-2xl">{brand.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {brand.products.length} product{brand.products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {brand.products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No products yet</h2>
          <p className="text-muted-foreground mb-6">Check back soon for new products from {brand.name}.</p>
          <Link href="/products" className={buttonVariants()}>Browse All Products</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {brand.products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                image: product.image?.url ?? null,
                sku: product.sku,
                price: product.price,
                comparePrice: product.comparePrice,
                onSale: (product.comparePrice ?? 0) > product.price,
                isNew: false,
                shortDescription: product.description,
                brand: product.category?.name ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
