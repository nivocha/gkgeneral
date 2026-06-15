import Link from "next/link"
import Image from "next/image"
import { Package, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { formatPrice } from "@/lib/utils"
import type { HomepageProduct } from "@/lib/homepage"

export function FeaturedProducts({ products }: { products: HomepageProduct[] }) {
  if (products.length === 0) return null

  return (
    <section className="bg-muted/30 py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-12">
          <div>
            <Badge variant="secondary" className="mb-4">
              Featured Products
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Premium Selection
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Hand-picked industrial products from world-class manufacturers.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground gap-2 flex-shrink-0"
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  )}
                  <Badge
                    className="absolute top-3 left-3"
                    variant={product.isNew ? "success" : product.onSale ? "warning" : "default"}
                  >
                    {product.isNew ? "New" : product.onSale ? "Sale" : "Featured"}
                  </Badge>
                </div>
              </Link>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {product.brand?.name || ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {product.category?.name || ""}
                  </span>
                </div>
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {product.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {product.price && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-lg font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.comparePrice)}
                        </span>
                        <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                          -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                        </Badge>
                      </>
                    )}
                  </div>
                )}
                <div className="mt-4">
                  <AddToCartButton
                    productId={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    slug={product.slug}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
