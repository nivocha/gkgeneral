import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getWishlist } from "@/features/wishlist/actions"
import { formatPrice } from "@/lib/utils"
import { Heart, Trash2 } from "lucide-react"
import { RemoveFromWishlistButton } from "./remove-button"

export default async function WishlistPage() {
  const items = await getWishlist()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Wishlist</h1>
          <p className="text-muted-foreground">{items.length} saved product{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-4">Save products you love to your wishlist.</p>
          <Link href="/products" className={buttonVariants()}>Browse Products</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <Link href={`/products/${item.product.slug}`} className="block">
                  <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                    {item.product.primaryImage ? (
                      <img src={item.product.primaryImage.url} alt={item.product.primaryImage.alt || item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                    )}
                  </div>
                  <h3 className="font-semibold line-clamp-2 mb-1">{item.product.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {item.product.price ? (
                      <span className="font-bold">{formatPrice(item.product.price)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Contact for price</span>
                    )}
                    <Badge variant="secondary" className="text-xs">{item.product.sku}</Badge>
                  </div>
                </Link>
                <RemoveFromWishlistButton productId={item.product.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
