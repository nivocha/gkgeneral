"use server"

import { requireAuth, requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { SubmitReviewSchema, GetReviewsSchema, GetAdminReviewsSchema } from "@/features/reviews/schemas/review.schema"
import { revalidatePath } from "next/cache"

export async function submitReview(productId: string, formData: FormData) {
  const user = await requireAuth()

  const raw = {
    productId,
    rating: formData.get("rating"),
    title: formData.get("title"),
    content: formData.get("content"),
  }

  const validated = SubmitReviewSchema.parse(raw)

  const product = await prisma.product.findUnique({
    where: { id: validated.productId },
    select: { id: true, name: true },
  })

  if (!product) {
    return { success: false, message: "Product not found" }
  }

  const review = await prisma.review.upsert({
    where: {
      productId_userId: { productId: validated.productId, userId: user.id },
    },
    update: {
      rating: validated.rating,
      title: validated.title || null,
      content: validated.content || null,
    },
    create: {
      productId: validated.productId,
      userId: user.id,
      rating: validated.rating,
      title: validated.title || null,
      content: validated.content || null,
    },
  })

  await logAuditEvent({
    userId: user.id,
    action: "CREATE",
    entity: "review",
    entityId: review.id,
    description: `Submitted review for product ${product.name}`,
    metadata: { productId: validated.productId, rating: validated.rating },
  })

  revalidatePath(`/products/${product.id}`)

  return { success: true, message: "Review submitted. It will appear after approval." }
}

export async function getProductReviews(productId: string, page?: number, pageSize?: number) {
  const params = GetReviewsSchema.parse({ productId, page: page ?? 1, pageSize: pageSize ?? 10 })

  const where = { productId: params.productId, isApproved: true }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.review.count({ where }),
  ])

  return {
    reviews,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  }
}

export async function getAdminReviews(page?: number, pageSize?: number, status?: string) {
  await requireRole("super_admin", "admin")

  const params = GetAdminReviewsSchema.parse({ page: page ?? 1, pageSize: pageSize ?? 20, status: status ?? "pending" })

  const where = params.status === "all" ? {} : { isApproved: params.status === "approved" }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
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
    prisma.review.count({ where }),
  ])

  return {
    reviews,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  }
}

export async function approveReview(formData: FormData) {
  const user = await requireRole("super_admin", "admin")

  const reviewId = formData.get("reviewId") as string
  if (!reviewId) return { success: false, message: "Review ID required" }

  await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved: true },
  })

  await logAuditEvent({
    userId: user.id,
    action: "UPDATE",
    entity: "review",
    entityId: reviewId,
    description: "Approved review",
  })

  revalidatePath("/admin/dashboard/reviews")
  return { success: true, message: "Review approved" }
}

export async function rejectReview(formData: FormData) {
  const user = await requireRole("super_admin", "admin")

  const reviewId = formData.get("reviewId") as string
  if (!reviewId) return { success: false, message: "Review ID required" }

  await prisma.review.delete({ where: { id: reviewId } })

  await logAuditEvent({
    userId: user.id,
    action: "DELETE",
    entity: "review",
    entityId: reviewId,
    description: "Rejected (deleted) review",
  })

  revalidatePath("/admin/dashboard/reviews")
  return { success: true, message: "Review rejected and removed" }
}

export async function deleteReview(formData: FormData) {
  const user = await requireRole("super_admin", "admin")

  const reviewId = formData.get("reviewId") as string
  if (!reviewId) return { success: false, message: "Review ID required" }

  await prisma.review.delete({ where: { id: reviewId } })

  await logAuditEvent({
    userId: user.id,
    action: "DELETE",
    entity: "review",
    entityId: reviewId,
    description: "Deleted review",
  })

  revalidatePath("/admin/dashboard/reviews")
  return { success: true, message: "Review deleted" }
}

export async function getUserReview(productId: string) {
  const user = await requireAuth()

  const review = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
  })

  return review
}
