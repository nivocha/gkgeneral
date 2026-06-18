"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShoppingCart, Download, ChevronLeft, ChevronRight,
  Phone, Star, FileText, CheckCircle, Package
} from "lucide-react"
import { useCartStore } from "@/features/carts/store"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ProductData {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  brand: { id: string; name: string; slug: string; logo: string | null } | null
  sku: string
  unit: string
  weight: string | null
  dimensions: string | null
  material: string | null
  warranty: string | null
  barcode: string | null
  minOrderQuantity: number
  maxOrderQuantity: number | null
  isFeatured: boolean
  isNew: boolean
  onSale: boolean
  price: number | null
  comparePrice: number | null
  currency: string
  stockQuantity: number
  tags: string[]
  category: { id: string; name: string; slug: string } | null
  images: { id: string; url: string; alt: string | null; isPrimary: boolean; sortOrder: number }[]
  variants: { id: string; name: string; sku: string; price: number; costPrice: number | null; attributes: string | null; isActive: boolean }[]
  specifications: { id: string; label: string; value: string; unit: string | null; sortOrder: number }[]
  downloads: { id: string; name: string; url: string; fileSize: string | null; type: string }[]
}

interface Props {
  product: ProductData
}

export function ProductDetailContent({ product }: Props) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(product.minOrderQuantity)
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.length > 0 ? product.variants[0] : null
  )
  const addItem = useCartStore((s) => s.addItem)
  const images = product.images

  const displayPrice = selectedVariant?.price ?? product.price ?? 0
  const displayComparePrice = product.comparePrice ? Number(product.comparePrice) : null
  const stockQuantity = product.stockQuantity

  const handleAddToCart = () => {
    addItem({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      productId: product.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      price: String(displayPrice),
      quantity,
    })
    toast.success("Added to cart")
  }

  return (
    <div className="container py-8 lg:py-12">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border">
            {images.length > 0 ? (
              <Image
                src={images[selectedImage]?.url || "/placeholder.svg"}
                alt={images[selectedImage]?.alt || product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSelectedImage((p) => (p - 1 + images.length) % images.length)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSelectedImage((p) => (p + 1) % images.length)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              {product.isNew && <Badge>New</Badge>}
              {product.onSale && <Badge variant="destructive">Sale</Badge>}
              {product.isFeatured && (
                <Badge variant="secondary">Featured</Badge>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors",
                    i === selectedImage ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || ""}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Breadcrumb-like header */}
          <div>
            {product.category && (
              <Link
                href={`/products?category=${product.category.id}`}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mt-1">
              {product.name}
            </h1>
            {product.brand && (
              <p className="text-lg text-muted-foreground mt-1">{product.brand.name}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {formatPrice(displayPrice, product.currency)}
            </span>
            {displayComparePrice && displayComparePrice > displayPrice && (
              <span className="text-xl text-muted-foreground line-through">
                {formatPrice(displayComparePrice, product.currency)}
              </span>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-muted-foreground leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Stock indicator */}
          <div className="flex items-center gap-2">
            {stockQuantity > 0 ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  In Stock ({stockQuantity} units)
                </span>
              </>
            ) : (
              <>
                <Package className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  Out of Stock
                </span>
              </>
            )}
          </div>

          <Separator />

          {/* Variants */}
          {product.variants.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Variant</label>
              <Select
                value={selectedVariant?.id || ""}
                onValueChange={(val) => {
                  const variant = product.variants.find((v) => v.id === val)
                  if (variant) setSelectedVariant(variant)
                }}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} - {formatPrice(v.price, product.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => setQuantity(Math.max(product.minOrderQuantity, quantity - 1))}
              >
                -
              </Button>
              <span className="w-14 text-center text-sm font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() =>
                  setQuantity(
                    product.maxOrderQuantity
                      ? Math.min(product.maxOrderQuantity, quantity + 1)
                      : quantity + 1
                  )
                }
              >
                +
              </Button>
            </div>
            <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/contact">
                <Phone className="h-5 w-5" /> Request Quote
              </Link>
            </Button>
          </div>

          {/* Key details */}
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {product.sku && (
              <div>
                <span className="text-muted-foreground">SKU:</span>{" "}
                <span className="font-mono">{product.sku}</span>
              </div>
            )}
            {product.unit && (
              <div>
                <span className="text-muted-foreground">Unit:</span> {product.unit}
              </div>
            )}
            {product.weight && (
              <div>
                <span className="text-muted-foreground">Weight:</span> {product.weight}
              </div>
            )}
            {product.dimensions && (
              <div>
                <span className="text-muted-foreground">Dimensions:</span>{" "}
                {product.dimensions}
              </div>
            )}
            {product.material && (
              <div>
                <span className="text-muted-foreground">Material:</span>{" "}
                {product.material}
              </div>
            )}
            {product.warranty && (
              <div>
                <span className="text-muted-foreground">Warranty:</span>{" "}
                {product.warranty}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description & Specs */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-12">
        {/* Description */}
        {product.description && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}

        {/* Specifications */}
        {product.specifications.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Technical Specifications
            </h2>
            <div className="rounded-lg border divide-y">
              {product.specifications.map((spec) => (
                <div key={spec.id} className="flex px-4 py-3 text-sm">
                  <span className="w-1/2 text-muted-foreground font-medium">
                    {spec.label}
                  </span>
                  <span className="w-1/2">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {product.tags.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Downloads */}
      {product.downloads.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Downloads</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {product.downloads.map((dl) => (
              <a
                key={dl.id}
                href={dl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Download className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{dl.name}</p>
                  {dl.fileSize && (
                    <p className="text-xs text-muted-foreground">{dl.fileSize}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
