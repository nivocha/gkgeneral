"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Trash2, ShoppingBag, Minus, Plus, ArrowRight, Loader2 } from "lucide-react"
import { useCartStore } from "@/features/carts/store"
import { formatPrice } from "@/lib/utils"

export default function CartPageClient() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const router = useRouter()
  const [isNavigating, startNavigation] = useTransition()

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || "0") * item.quantity), 0)

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Browse our products and add items to your cart.</p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Button variant="ghost" size="sm" onClick={() => clearCart()}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.productId}>
              <CardContent className="flex gap-4 p-4">
                <div className="relative w-24 h-24 rounded-md bg-muted flex-shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover rounded-md" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{formatPrice(parseFloat(item.price || "0"))}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border rounded-md">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem(item.productId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(parseFloat(item.price || "0") * item.quantity)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                disabled={isNavigating}
                onClick={() => startNavigation(() => router.push("/checkout"))}
              >
                {isNavigating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...</>
                ) : (
                  <>Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
