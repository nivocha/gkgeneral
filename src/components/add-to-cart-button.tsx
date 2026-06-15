"use client"

import { useState } from "react"
import { ShoppingCart, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/features/carts/store"
import { toast } from "sonner"

type AddToCartButtonProps = {
  productId: string
  name: string
  price: number | null
  image?: string | null
  slug: string
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function AddToCartButton({
  productId,
  name,
  price,
  image,
  slug,
  variant = "default",
  size = "sm",
  className,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)

  const handleClick = () => {
    addItem({
      id: productId,
      productId,
      name,
      price: String(price ?? 0),
      quantity: 1,
      image: image ?? undefined,
      slug,
    })
    setAdded(true)
    toast.success(`${name} added to cart`)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={added}
    >
      {added ? (
        <><Check className="mr-1.5 h-3.5 w-3.5" /> Added</>
      ) : (
        <><ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Add to Cart</>
      )}
    </Button>
  )
}
