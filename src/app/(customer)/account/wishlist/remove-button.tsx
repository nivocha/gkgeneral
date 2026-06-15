"use client"

import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { removeFromWishlist } from "@/features/wishlist/actions"

export function RemoveFromWishlistButton({ productId }: { productId: string }) {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={async () => {
        await removeFromWishlist(productId)
        router.refresh()
      }}
    >
      <Trash2 className="h-4 w-4 mr-1" /> Remove
    </Button>
  )
}
