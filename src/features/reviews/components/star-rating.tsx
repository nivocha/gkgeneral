"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

type StarRatingProps = {
  rating: number
  size?: number
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function StarRating({ rating, size = 16, interactive = false, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          disabled={!interactive}
          onClick={interactive ? () => onChange?.(star) : undefined}
          className={cn(
            "transition-colors",
            interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
          )}
        >
          <Star
            size={size}
            className={cn(
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600"
            )}
          />
        </button>
      ))}
    </div>
  )
}
