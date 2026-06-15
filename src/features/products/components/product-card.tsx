"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart, Eye, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useCartStore } from "@/features/carts/store"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

type ProductCardProps = {
  product: {
    id: string
    name: string
    slug: string
    image: string | null
    shortDescription?: string | null
    sku: string
    price?: number | null
    comparePrice?: number | null
    brand?: { id: string; name: string; slug: string } | string | null
    onSale: boolean
    isNew: boolean
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const brandName = typeof product.brand === "object" && product.brand ? product.brand.name : product.brand
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: String(product.price ?? 0),
      quantity: 1,
      image: product.image ?? undefined,
      slug: product.slug,
    })
    setAdded(true)
    toast.success(`${product.name} added to cart`)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Card className="group overflow-hidden">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-muted">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Eye className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            {product.isNew && <Badge variant="success">New</Badge>}
            {product.onSale && <Badge variant="warning">Sale</Badge>}
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        {brandName && (
          <p className="text-xs text-muted-foreground mb-1">{brandName}</p>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {product.shortDescription}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">SKU: {product.sku}</p>
        {product.price && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-foreground">
              {formatPrice(Number(product.price))}
            </span>
            {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(Number(product.comparePrice))}
                </span>
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  -{Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}%
                </Badge>
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" size="sm" onClick={handleAddToCart} disabled={added}>
          {added ? (
            <><Check className="mr-2 h-4 w-4" /> Added</>
          ) : (
            <><ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart</>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-square rounded-none" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}
