"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StarRating } from "./star-rating"
import { getProductReviews } from "@/features/reviews/actions/review-actions"
import { formatDate } from "@/lib/utils"

type Review = {
  id: string
  rating: number
  title: string | null
  content: string | null
  createdAt: Date
  user: { name: string }
}

type ReviewListProps = {
  productId: string
}

export function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getProductReviews(productId, page, 10).then((data) => {
      setReviews(data.reviews as Review[])
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setLoading(false)
    })
  }, [productId, page])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Reviews ({total})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No reviews yet. Be the first to review!
          </p>
        )}

        {!loading &&
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={review.rating} />
                <span className="text-sm font-medium">{review.user.name}</span>
                <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
              </div>
              {review.title && <p className="font-medium text-sm">{review.title}</p>}
              {review.content && <p className="text-sm text-muted-foreground mt-1">{review.content}</p>}
            </div>
          ))}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
