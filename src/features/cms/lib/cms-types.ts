import { z } from "zod"

export const CmsPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").transform((val) => val.toLowerCase()),
  content: z.string().min(1, "Content is required"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type CmsPageInput = z.infer<typeof CmsPageSchema>
