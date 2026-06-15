import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { AdminReviewsClient } from "./admin-reviews-client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Reviews | Admin" }

export default async function AdminReviewsPage() {
  await requireRole("super_admin", "admin")

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      skip: 0,
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        isApproved: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.review.count(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground mt-1">{total} reviews total</p>
      </div>
      <AdminReviewsClient initialReviews={reviews} initialTotal={total} />
    </div>
  )
}
