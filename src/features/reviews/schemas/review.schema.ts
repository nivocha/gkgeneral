import { z } from "zod"

export const SubmitReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.coerce.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().max(200, "Title is too long").optional().or(z.literal("")),
  content: z.string().max(5000, "Review is too long").optional().or(z.literal("")),
})

export type SubmitReviewInput = z.infer<typeof SubmitReviewSchema>

export const GetReviewsSchema = z.object({
  productId: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
})

export type GetReviewsInput = z.infer<typeof GetReviewsSchema>

export const GetAdminReviewsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["pending", "approved", "all"]).default("pending"),
})

export type GetAdminReviewsInput = z.infer<typeof GetAdminReviewsSchema>
