"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StarRating } from "./star-rating"
import { submitReview } from "@/features/reviews/actions/review-actions"

type ReviewFormProps = {
  productId: string
  isAuthenticated: boolean
  existingReview?: { rating: number; title: string | null; content: string | null } | null
}

export function ReviewForm({ productId, isAuthenticated, existingReview }: ReviewFormProps) {
  const submitReviewBound = submitReview.bind(null, productId)

  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return submitReviewBound(formData)
    },
    undefined
  )

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to review this product.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingReview ? "Edit Your Review" : "Write a Review"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state?.success && (
            <Alert>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          {state?.message && !state?.success && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating
              rating={existingReview?.rating ?? 0}
              size={28}
              interactive
              onChange={(r) => {
                const input = document.querySelector<HTMLInputElement>('input[name="rating"]')
                if (input) input.value = String(r)
              }}
            />
            <input type="hidden" name="rating" defaultValue={existingReview?.rating ?? 0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              name="title"
              placeholder="Summary of your review"
              defaultValue={existingReview?.title ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Review (optional)</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Share your experience with this product..."
              rows={4}
              defaultValue={existingReview?.content ?? ""}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingReview ? "Update Review" : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
