"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, XCircle, Trash2, Star, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate, cn } from "@/lib/utils"
import { approveReview, rejectReview, deleteReview } from "@/features/reviews/actions/review-actions"

type Review = {
  id: string
  rating: number
  title: string | null
  content: string | null
  isApproved: boolean
  createdAt: Date
  user: { id: string; name: string }
  product: { id: string; name: string; slug: string }
}

type Props = {
  initialReviews: Review[]
  initialTotal: number
}

export function AdminReviewsClient({ initialReviews, initialTotal }: Props) {
  const router = useRouter()
  const [reviews, setReviews] = useState(initialReviews)
  const [total, setTotal] = useState(initialTotal)
  const [status, setStatus] = useState("pending")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)

  const filtered = status === "all" ? reviews : reviews.filter((r) => status === "approved" ? r.isApproved : !r.isApproved)

  const handleApprove = async (reviewId: string) => {
    setLoadingId(reviewId)
    const formData = new FormData()
    formData.set("reviewId", reviewId)
    await approveReview(formData)
    setLoadingId(null)
    router.refresh()
  }

  const handleReject = async (reviewId: string) => {
    setLoadingId(reviewId)
    const formData = new FormData()
    formData.set("reviewId", reviewId)
    await rejectReview(formData)
    setLoadingId(null)
    router.refresh()
  }

  const handleDelete = async (reviewId: string) => {
    setLoadingId(reviewId)
    const formData = new FormData()
    formData.set("reviewId", reviewId)
    await deleteReview(formData)
    setDeleteDialog(null)
    setLoadingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{filtered.length} of {total} reviews</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="hidden md:table-cell">Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No reviews found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {review.product.name}
                </TableCell>
                <TableCell>{review.user.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{review.rating}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-[250px]">
                  <div className="truncate">
                    {review.title && <span className="font-medium">{review.title}</span>}
                    {review.title && review.content && <span> — </span>}
                    {review.content && <span className="text-muted-foreground">{review.content}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={review.isApproved ? "default" : "secondary"}>
                    {review.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatDate(review.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {!review.isApproved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        disabled={loadingId === review.id}
                        onClick={() => handleApprove(review.id)}
                      >
                        {loadingId === review.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {!review.isApproved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        disabled={loadingId === review.id}
                        onClick={() => handleReject(review.id)}
                      >
                        {loadingId === review.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setDeleteDialog(review.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The review will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={loadingId === deleteDialog}
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              {loadingId === deleteDialog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
